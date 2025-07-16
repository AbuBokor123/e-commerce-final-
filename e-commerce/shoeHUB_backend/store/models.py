from django.db import models
from django.contrib.auth.models import AbstractUser, User
from django.conf import settings

def product_image_path(instance, filename):
    # File will be uploaded to MEDIA_ROOT/products/<product_id>/<filename>
    return f'products/{instance.id}/{filename}'

class User(AbstractUser):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    last_login = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.username

class Brand(models.Model):
    title = models.CharField(max_length=255)


    class Meta:
        db_table = 'brand'

    def __str__(self):
        return self.title

class Category(models.Model):
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=[('active', 'Active'), ('inactive', 'Inactive')], default='active')

    class Meta:
        db_table = 'category'

    def __str__(self):
        return self.title

class Product(models.Model):
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, null=True, blank=True)
    details = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=[('active', 'Active'), ('inactive', 'Inactive')], default='active')
    cover_image = models.ImageField(upload_to=product_image_path)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product'

    def __str__(self):
        return self.title

class SubProduct(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sub_products')
    color = models.CharField(max_length=50)
    size = models.CharField(max_length=20)
    stock = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=[('active', 'Active'), ('inactive', 'Inactive')], default='active')
    image = models.ImageField(upload_to='products/subproduct_images/', null=True, blank=True)  # New field for color image

    class Meta:
        db_table = 'subproduct'

    def __str__(self):
        return f"{self.product.title} - {self.color} - {self.size}"

class ShippingAddress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.address}, {self.city}, {self.country}"

class Order(models.Model):
    invoice_number = models.CharField(max_length=100, blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    shipping = models.ForeignKey(ShippingAddress, on_delete=models.CASCADE)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    date_time = models.DateTimeField(auto_now_add=True)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('returned', 'Returned'),
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20)

    class Meta:
        db_table = 'order'

    def __str__(self):
        return f"Order {self.id} by {self.user.username}"

class OrderProduct(models.Model):
    ordersid = models.ForeignKey(Order, on_delete=models.CASCADE, db_column='ordersid')
    subproductid = models.IntegerField(db_column='subproductid')  # You can use ForeignKey to SubProduct if you want
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField()

    class Meta:
        db_table = 'orderproduct'
        managed = False

    def __str__(self):
        return f"OrderProduct {self.id} (Order {self.ordersid_id})"
