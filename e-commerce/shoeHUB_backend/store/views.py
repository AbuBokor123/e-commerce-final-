# --- SMTP OTP Password Reset ---
import random
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

# Store OTPs in memory for demo (use cache/db in production)
OTP_STORE = {}

@api_view(['POST'])
def request_password_otp(request):
    email = request.data.get('email')
    User = get_user_model()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'Email not found'}, status=404)
    otp = str(random.randint(100000, 999999))
    OTP_STORE[email] = {'otp': otp, 'expires': timezone.now() + timedelta(minutes=10)}
    send_mail(
        subject='Your ShoeHub OTP',
        message=f'Your OTP is: {otp}',
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[email],
        fail_silently=False,
    )
    return Response({'message': 'OTP sent to email'}, status=200)

@api_view(['POST'])
def verify_password_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    otp_data = OTP_STORE.get(email)
    if not otp_data or otp_data['expires'] < timezone.now():
        return Response({'error': 'OTP expired or not found'}, status=400)
    if otp_data['otp'] != otp:
        return Response({'error': 'Invalid OTP'}, status=400)
    return Response({'message': 'OTP verified'}, status=200)

@api_view(['POST'])
def reset_password_with_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    new_password = request.data.get('new_password')
    otp_data = OTP_STORE.get(email)
    if not otp_data or otp_data['expires'] < timezone.now():
        return Response({'error': 'OTP expired or not found'}, status=400)
    if otp_data['otp'] != otp:
        return Response({'error': 'Invalid OTP'}, status=400)
    User = get_user_model()
    try:
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()
        del OTP_STORE[email]
        return Response({'message': 'Password reset successful'}, status=200)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from .serializers import ShippingAddressSerializer
# Shipping Address List/Create (GET/POST)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def shippingaddress_list_create(request):
    user = request.user
    if request.method == 'GET':
        addresses = ShippingAddress.objects.filter(user=user)
        serializer = ShippingAddressSerializer(addresses, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = ShippingAddressSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Admin: Get all orders
@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_all_orders(request):
    try:
        orders = Order.objects.select_related('user').order_by('-date_time')
        order_list = []
        for order in orders:
            order_products = OrderProduct.objects.filter(ordersid=order.id)
            products = []
            for op in order_products:
                try:
                    subproduct = SubProduct.objects.get(id=op.subproductid)
                    product = subproduct.product
                    products.append({
                        'product_name': product.title,
                        'size': subproduct.size,
                        'color': subproduct.color,
                        'quantity': op.quantity,
                        'price': float(op.price),
                    })
                except SubProduct.DoesNotExist:
                    continue
            order_list.append({
                'id': order.id,
                'user_id': order.user.id,
                'user_name': order.user.username,
                'date_time': order.date_time,
                'total': float(order.total),
                'status': order.status,
                'payment_method': order.payment_method,
                'products': products,
            })
        return Response(order_list, status=200)
    except Exception as e:
        print(f"Error fetching all orders: {str(e)}")
        return Response({'error': str(e)}, status=500)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q, Count, Sum
from django.db.models.functions import Coalesce, TruncMonth
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Product, SubProduct, Brand, Category, ShippingAddress, Order, OrderProduct
from .serializers import SubProductSerializer, UserSerializer, ProductSerializer, BrandSerializer, CategorySerializer, ShippingAddressSerializer
from .utils import send_welcome_email
from django.utils import timezone
import random
from django.db import connection
from rest_framework.decorators import action

class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = User.objects.create_user(
                username=request.data['username'],
                email=request.data['email'],
                password=request.data['password'],
                role=request.data.get('role', 'user'),
                first_name=request.data.get('first_name', ''),
                last_name=request.data.get('last_name', '')
            )
            
            # If registering as admin, set staff status
            if request.data.get('role') == 'admin':
                user.is_staff = True
                user.save()

            try:
                send_welcome_email(user.email, user.username)
            except Exception as e:
                print(f"Failed to send email: {str(e)}")
                # Continue execution even if email fails
                
            return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)

        if user:
            login(request, user)
            return Response({'message': 'Login successful', 'role': user.role}, status=status.HTTP_200_OK)
        return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def get_queryset(self):
        queryset = Product.objects.all()
        
        # Get filter parameters from request
        category = self.request.query_params.get('category', None)
        status = self.request.query_params.get('status', None)
        search = self.request.query_params.get('search', None)
        
        if category:
            queryset = queryset.filter(category_id=category)
        
        if status:
            queryset = queryset.filter(status=status)
            
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(details__icontains=search) |
                Q(brand__title__icontains=search) |
                Q(category__title__icontains=search)
            )
            
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            print("Request data:", request.data)  # Debug print
            print("Request files:", request.FILES)  # Debug print
            
            # Create product
            product = Product.objects.create(
                title=request.data.get('productName'),
                details=request.data.get('productDescription'),
                price=request.data.get('productPrice'),
                brand_id=request.data.get('productBrand'),
                category_id=request.data.get('productCategory'),
                cover_image=request.FILES.get('productImage'),
                status='active'
            )

            # Create sub-products
            colors = request.data.get('productColor', '').split(',')
            sizes = request.data.get('productSize', '').split(',')

            # Create sub-products with images
            colors = [c.strip() for c in request.data.get('productColor', '').split(',') if c.strip()]
            sizes = [s.strip() for s in request.data.get('productSize', '').split(',') if s.strip()]
            stocks = [st.strip() for st in request.data.get('productStock', '').split(',') if st.strip()]

            # Expect subproduct images as productImage_colorname (e.g., productImage_red)
            for idx, color in enumerate(colors):
                image_field_name = f'subproductImage_{color}'
                image = request.FILES.get(image_field_name)
                size = sizes[idx] if idx < len(sizes) else ''
                stock = int(stocks[idx]) if idx < len(stocks) and stocks[idx].isdigit() else 0
                SubProduct.objects.create(
                    product=product,
                    color=color,
                    size=size,
                    stock=stock,
                    status='active',
                    image=image
                )

            return Response({'message': 'Product created successfully'}, status=201)

        except Exception as e:
            print(f"Error creating product: {str(e)}")  # Debug print
            return Response({'error': str(e)}, status=400)

    @action(detail=True, methods=['post'], url_path='edit', url_name='edit_product')
    def edit_product(self, request, pk=None):
        try:
            product = self.get_object()
            serializer = self.get_serializer(product, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                # --- SubProduct update logic ---
                colors = request.data.get('subproduct_colors', '')
                sizes = request.data.get('subproduct_sizes', '')
                stocks = request.data.get('subproduct_stocks', '')

                color_list = [c.strip() for c in colors.split(',')] if colors else []
                size_list = [s.strip() for s in sizes.split(',')] if sizes else []
                stock_list = [int(s.strip()) if s.strip().isdigit() else 0 for s in stocks.split(',')] if stocks else []

                # Get all existing subproducts for this product
                existing_subproducts = {(sp.color, sp.size): sp for sp in SubProduct.objects.filter(product=product)}

                # Mark all as inactive by default
                for sp in existing_subproducts.values():
                    sp.status = 'inactive'
                    sp.save()

                # Reactivate or create subproducts as needed
                for i in range(max(len(color_list), len(size_list), len(stock_list))):
                    color = color_list[i] if i < len(color_list) else ''
                    size = size_list[i] if i < len(size_list) else ''
                    stock = stock_list[i] if i < len(stock_list) else 0
                    key = (color, size)
                    if key in existing_subproducts:
                        sp = existing_subproducts[key]
                        sp.stock = stock
                        sp.status = 'active'
                        sp.save()
                    else:
                        SubProduct.objects.create(
                            product=product,
                            color=color,
                            size=size,
                            stock=stock,
                            status='active'
                        )
                return Response(serializer.data)
            print("EDIT ERRORS:", serializer.errors)  # Debug
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print("EDIT PRODUCT EXCEPTION:", str(e))  # Debug
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        subproducts = SubProduct.objects.filter(product=product)
        # Check if any subproduct is in an order
        if OrderProduct.objects.filter(subproductid__in=subproducts.values_list('id', flat=True)).exists():
            return Response(
                {"error": "Cannot delete product: One or more subproducts are part of an order."},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Safe to delete subproducts and product
        subproducts.delete()
        return super().destroy(request, *args, **kwargs)

@api_view(['GET'])
def get_brands(request):
    brands = Brand.objects.all()
    serializer = BrandSerializer(brands, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_categories(request):
    categories = Category.objects.filter(status='active')
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_customers(request):
    try:
        # Get filter parameters
        status = request.GET.get('status')
        sort = request.GET.get('sort')
        search = request.GET.get('search')

        # Base queryset - exclude superusers and staff
        customers = User.objects.filter(is_superuser=False, is_staff=False)

        # Apply filters
        if status:
            customers = customers.filter(is_active=status == 'active')

        if search:
            customers = customers.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        # Apply sorting
        if sort == 'newest':
            customers = customers.order_by('-date_joined')
        elif sort == 'oldest':
            customers = customers.order_by('date_joined')
        elif sort == 'name':
            customers = customers.order_by('first_name', 'last_name')

        # Serialize the data
        serializer = UserSerializer(customers, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"Error fetching customers: {str(e)}")  # Debug print
        return Response({'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'DELETE'])
def manage_customer(request, pk):
    try:
        customer = User.objects.get(pk=pk, is_superuser=False, is_staff=False)
    except User.DoesNotExist:
        return Response({'detail': 'Customer not found'}, status=404)

    if request.method == 'GET':
        serializer = UserSerializer(customer)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = UserSerializer(customer, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    elif request.method == 'DELETE':
        customer.delete()
        return Response(status=204)

@api_view(['GET'])
def get_admins(request):
    try:
        # Get filter parameters
        sort = request.GET.get('sort')
        search = request.GET.get('search')

        # Get only users with role='admin'
        admins = User.objects.filter(role='admin')

        # Apply search filter if provided
        if search:
            admins = admins.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        # Apply sorting
        if sort == 'newest':
            admins = admins.order_by('-date_joined')
        elif sort == 'oldest':
            admins = admins.order_by('date_joined')
        elif sort == 'name':
            admins = admins.order_by('first_name', 'last_name')
        else:
            # Default sorting by id
            admins = admins.order_by('id')

        serializer = UserSerializer(admins, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"Error fetching admins: {str(e)}")  # Debug print
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def create_admin(request):
    try:
        # Add required admin fields
        data = request.data.copy()
        data['role'] = 'admin'  # Ensure role is set to admin
        data['is_staff'] = True
        data['username'] = data.get('email')  # Use email as username

        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            admin = serializer.save()
            # Set password separately to ensure proper hashing
            admin.set_password(data.get('password'))
            admin.save()
            
            return Response(UserSerializer(admin).data, status=201)
        return Response(serializer.errors, status=400)
    except Exception as e:
        print(f"Error creating admin: {str(e)}")  # Debug print
        return Response({'error': str(e)}, status=500)

@api_view(['PUT', 'DELETE'])
def manage_admin(request, pk):
    try:
        # Only get users with role='admin'
        admin = User.objects.get(pk=pk, role='admin')
    except User.DoesNotExist:
        return Response({'detail': 'Admin not found'}, status=404)

    if request.method == 'PUT':
        data = request.data.copy()
        data['role'] = 'admin'  # Ensure role remains admin
        serializer = UserSerializer(admin, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    elif request.method == 'DELETE':
        admin.delete()
        return Response(status=204)

    address_data = request.data
    address_obj, created = ShippingAddress.objects.update_or_create(
        user=request.user,
        defaults={
            'address': address_data.get('address'),
            'city': address_data.get('city'),
            'state': address_data.get('state'),
            'zip_code': address_data.get('zip_code'),
            'country': address_data.get('country'),
        }
    )
    serializer = ShippingAddressSerializer(address_obj)
    return Response(serializer.data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_order(request):
    try:
        data = request.data
        cart = data.get('cart', [])
        shipping_id = data.get('shipping_id')
        payment_method = data.get('payment_method')
        total = data.get('total')
        user = request.user

        shipping = ShippingAddress.objects.get(id=shipping_id, user=user)
        invoice_number = f"INV{random.randint(10000,99999)}"
        tracking_number = f"TRK{random.randint(10000,99999)}"

        order = Order.objects.create(
            user=user,
            shipping=shipping,
            total=total,
            payment_method=payment_method,
            invoice_number=invoice_number,
            tracking_number=tracking_number,
            status='processing',
        )

        for item in cart:
            subproduct_id = item['id']
            price = item['price']
            qty = item['qty']
            OrderProduct.objects.create(
                ordersid=order,
                subproductid=subproduct_id,
                price=price,
                discount=0,
                quantity=qty
            )

        return Response({'order_id': order.id, 'invoice_number': invoice_number, 'tracking_number': tracking_number}, status=201)
    except Exception as e:
        print("ORDER ERROR:", str(e))
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_orders(request):
    try:
        # Basic order retrieval with JOIN
        query = """
        SELECT o.*, s.address, s.city, s.state, s.zip_code, s.country
        FROM orders o
        JOIN shipping_address s ON o.shipping_id = s.id
        WHERE o.user_id = %s
        """
        user_id = request.user.id

        with connection.cursor() as cursor:
            cursor.execute(query, [user_id])
            orders = cursor.fetchall()

        # Manually serialize the data
        order_list = []
        for order in orders:
            order_dict = {
                'id': order[0],
                'invoice_number': order[1],
                'user_id': order[2],
                'shipping_id': order[3],
                'subtotal': order[4],
                'discount': order[5],
                'shipping_cost': order[6],
                'total': order[7],
                'date_time': order[8],
                'tracking_number': order[9],
                'status': order[10],
                'payment_method': order[11],
                'address': order[12],
                'city': order[13],
                'state': order[14],
                'zip_code': order[15],
                'country': order[16],
            }
            order_list.append(order_dict)

        return Response(order_list, status=200)
    except Exception as e:
        print(f"Error fetching orders: {str(e)}")  # Debug print
        return Response({'error': str(e)}, status=500)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_orders_full(request):
    user_id = request.user.id
    order_id = request.GET.get('id')
    try:
        orders = Order.objects.filter(user_id=user_id).order_by('-date_time')
        if order_id:
            orders = orders.filter(id=order_id)
        order_list = []
        for order in orders:
            # Get products for this order
            order_products = OrderProduct.objects.filter(ordersid=order.id)
            products = []
            for op in order_products:
                try:
                    subproduct = SubProduct.objects.get(id=op.subproductid)
                    product = subproduct.product
                    products.append({
                        'product_name': product.title,
                        'product_image': subproduct.image.url if subproduct.image else '',
                        'size': subproduct.size,
                        'color': subproduct.color,
                        'quantity': op.quantity,
                        'price': float(op.price),
                    })
                except SubProduct.DoesNotExist:
                    continue
            # Get status history (dummy for now)
            status_history = [{
                'status': order.status,
                'date_time': order.date_time,
                'admin_id': None,
            }]
            order_list.append({
                'id': order.id,
                'invoice_number': order.invoice_number,
                'subtotal': float(getattr(order, 'subtotal', 0)),
                'discount': float(getattr(order, 'discount', 0)),
                'shipping_cost': float(getattr(order, 'shipping_cost', 0)),
                'total': float(order.total),
                'date_time': order.date_time,
                'tracking_number': order.tracking_number,
                'status': order.status,
                'payment_method': order.payment_method,
                'products': products,
                'status_history': status_history,
            })
        if order_id:
            if order_list:
                return Response(order_list[0])
            else:
                return Response({'detail': 'Order not found'}, status=404)
        return Response(order_list)
    except Exception as e:
        print("USER ORDERS ERROR:", str(e))
        return Response({'error': str(e)}, status=500)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from .models import Product, User, Order

# --- CODE ANALYTICS API ---
@api_view(['GET'])
@permission_classes([IsAdminUser])
def code_analytics(request):
    # Business analytics: top-selling products, total sales, revenue
    from django.db.models import Sum
    days = request.GET.get('days', '7')
    try:
        # Filter orders by days
        from django.utils import timezone
        from datetime import timedelta
        since = timezone.now() - timedelta(days=int(days) if days.isdigit() else 7)
        orders = Order.objects.filter(date_time__gte=since)
        total_sales = orders.count()
        total_revenue = orders.aggregate(total=Sum('total'))['total'] or 0
        # Top-selling products
        top_products = (
            OrderProduct.objects
            .filter(ordersid__in=orders)
            .values('subproductid')
            .annotate(quantity=Sum('quantity'))
            .order_by('-quantity')[:5]
        )
        # Get product names
        product_names = []
        quantities = []
        for item in top_products:
            sub_id = item['subproductid']
            try:
                sub = SubProduct.objects.get(id=sub_id)
                product_names.append(f"{sub.product.title} ({sub.color}/{sub.size})")
            except SubProduct.DoesNotExist:
                product_names.append(f"ID {sub_id}")
            quantities.append(item['quantity'])
        return Response({
            'labels': product_names,
            'data': quantities,
            'total_sales': total_sales,
            'total_revenue': float(total_revenue),
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_stats(request):
    return Response({
        "products": Product.objects.count(),
        "users": User.objects.filter(role='user').count(),
        "orders": Order.objects.count(),
        "revenue": Order.objects.aggregate(total=Sum('total'))['total'] or 0
    })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def recent_buyers(request):
    # Get the last 5 unique users who placed orders
    orders = Order.objects.select_related('user').order_by('-date_time')
    seen_users = set()
    buyers = []
    for order in orders:
        if order.user.id not in seen_users:
            seen_users.add(order.user.id)
            buyers.append({
                "name": order.user.username,
                "avatar": "",  # Add avatar if you have it
                "category": order.status,  # Or any info you want
                "amount": float(order.total)
            })
        if len(buyers) >= 5:
            break
    return Response(buyers)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def recent_orders(request):
    orders = Order.objects.select_related('user').order_by('-date_time')[:5]
    order_list = []
    for order in orders:
        # Get all products for this order
        order_products = OrderProduct.objects.filter(ordersid=order.id)
        product_titles = []
        for op in order_products:
            try:
                product = Product.objects.get(id=op.subproductid)
                product_titles.append(product.title)
            except Product.DoesNotExist:
                continue
        order_list.append({
            "id": order.id,
            "customer": order.user.username,
            "product": ", ".join(product_titles),
            "date": order.date_time.strftime('%Y-%m-%d'),
            "amount": float(order.total),
            "status": order.status
        })
    return Response(order_list)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def sales_chart_data(request):
    sales = (
        Order.objects
        .filter(status='ordered')  # or whatever status means "completed"
        .annotate(month=TruncMonth('date_time'))
        .values('month')
        .annotate(total=Sum('total'))
        .order_by('month')
    )
    # Format for Chart.js
    labels = [s['month'].strftime('%b') for s in sales]
    data = [float(s['total']) for s in sales]
    return Response({'labels': labels, 'data': data})
