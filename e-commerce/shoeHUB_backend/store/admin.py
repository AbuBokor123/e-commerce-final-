from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User
from .models import User, Brand, Category, Product, SubProduct

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role',)}),
    )


class BrandAdmin(admin.ModelAdmin):
    list_display = ['id', 'title']  # REMOVE 'status' if present
    # list_filter = ['status']      # REMOVE this line if present

admin.site.register(Brand, BrandAdmin)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('title', 'status')
    list_filter = ('status',)
    search_fields = ('title',)

class SubProductInline(admin.TabularInline):
    model = SubProduct
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'brand', 'category', 'price', 'status', 'created_at')
    list_filter = ('status', 'brand', 'category')
    search_fields = ('title', 'subtitle')
    inlines = [SubProductInline]
    readonly_fields = ('created_at', 'updated_at')

@admin.register(SubProduct)
class SubProductAdmin(admin.ModelAdmin):
    list_display = ('product', 'size', 'color', 'status')
    list_filter = ('status', 'size', 'color')
    search_fields = ('product__title', 'size', 'color')