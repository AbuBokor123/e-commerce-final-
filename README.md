# E-Commerce Platform

## Project Overview
This is a full-stack e-commerce platform designed to provide a seamless online shopping experience. The project is divided into a Django-based backend (with MySQL database) and a static HTML/CSS/JS frontend. It supports user authentication, product management, order processing, and admin functionalities.

---

## Features
- User registration, login, and authentication
- Product catalog with detailed product pages
- Shopping cart and checkout process
- Order management for users and admins
- Wishlist functionality
- Admin dashboard for managing products, orders, and users
- Activity logs and analytics for admins
- Responsive design for desktop and mobile

---

## Backend (Django + MySQL)
- **Framework:** Django (Python)
- **Database:** MySQL
- **Key Apps:**
  - `store`: Handles products, orders, users, brands, categories, etc.
- **API:** RESTful endpoints for all major operations (products, orders, authentication, etc.)
- **Authentication:** Secure user authentication and authorization (session or token-based)
- **Media Handling:** Product images and user-uploaded content

### Setup Instructions (Backend)
1. **Install Python & MySQL**
2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. **Install dependencies:**
   ```bash
   pip install django mysqlclient
   ```
4. **Configure MySQL database in `settings.py`**
5. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
6. **Create a superuser:**
   ```bash
   python manage.py createsuperuser
   ```
7. **Run the development server:**
   ```bash
   python manage.py runserver
   ```

---

## Frontend (HTML/CSS/JS)
- **Location:** `e-commerce/frontend/`
- **Technologies:** HTML, CSS, JavaScript
- **Pages:** Home, Product Details, Cart, Checkout, User Account, Admin Dashboard, etc.
- **Assets:** Product images, icons, and stylesheets
- **How to Use:**
  - Open `index.html` in a browser for the main site
  - Admin pages are available for users with admin privileges

---

## Folder Structure
```
e-commerce(final)/
  ├── e-commerce/
      ├── frontend/         # Frontend static files
      └── shoeHUB_backend/  # Django backend
```

---

## Contribution Guidelines
1. Fork the repository and create a new branch for your feature or bugfix.
2. Follow PEP8 (for Python) and best practices for HTML/CSS/JS.
3. Write clear commit messages.
4. Test your changes before submitting a pull request.

---

## Credits
- Developed by: [Abu Bokor,Kushal,Fahi]
- Backend: Django, MySQL
- Frontend: HTML, CSS, JavaScript

---

## License
This project is licensed under the MIT License.
