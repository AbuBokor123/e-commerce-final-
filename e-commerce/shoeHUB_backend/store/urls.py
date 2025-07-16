from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, ProductViewSet, get_brands, get_categories, get_customers,
    manage_customer, get_admins, create_admin, manage_admin,
    place_order, user_orders_full, admin_dashboard_stats,
    recent_buyers, recent_orders, sales_chart_data, code_analytics, get_all_orders,
    request_password_otp, verify_password_otp, reset_password_with_otp,shippingaddress_list_create
)
from .serializers import CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/', include(router.urls)),
    path('api/brands/', get_brands, name='brands'),
    path('api/categories/', get_categories, name='categories'),
    path('api/customers/', get_customers, name='get_customers'),
    path('customers/', get_customers, name='get_customers'),
    path('api/customers/<int:pk>/', manage_customer, name='manage_customer'),
    path('api/admins/', get_admins, name='get_admins'),
    path('api/admin/create/', create_admin, name='create_admin'),
    path('api/admins/<int:pk>/', manage_admin, name='manage_admin'),
    # path('auth/logout/', logout_view, name='auth_logout'),
    path('api/shippingaddress/', shippingaddress_list_create, name='shippingaddress-list-create'),
    # path('api/shippingaddress/<int:pk>/', shippingaddress_list_create, name='shippingaddress-detail'),
    path('api/place_order/', place_order, name='place_order'),
    path('api/user-orders/', user_orders_full, name='user_orders_full'),
    path('api/orders/', get_all_orders, name='get_all_orders'),
    path('api/admin-dashboard-stats/', admin_dashboard_stats, name='admin_dashboard_stats'),
    path('api/recent-buyers/', recent_buyers, name='recent_buyers'),
    path('api/recent-orders/', recent_orders, name='recent_orders'),
    path('api/sales-chart-data/', sales_chart_data, name='sales_chart_data'),
    path('api/code-analytics/', code_analytics, name='code_analytics'),
    path('api/auth/request-password-otp/', request_password_otp, name='request_password_otp'),
    path('api/auth/verify-password-otp/', verify_password_otp, name='verify_password_otp'),
    path('api/auth/reset-password-otp/', reset_password_with_otp, name='reset_password_with_otp'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
