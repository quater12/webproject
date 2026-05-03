from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Lot, Profile

User = get_user_model()


class AuthAndLotFlowTests(APITestCase):
    def test_register_with_email_returns_tokens(self):
        payload = {
            "email": "qa_buyer@example.com",
            "password": "buyer1234",
            "role": "buyer",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])

    def test_user_can_create_lot_with_single_account(self):
        buyer = User.objects.create_user(username="buyer", email="buyer@test.com", password="buyer1234")
        Profile.objects.create(user=buyer, role="buyer")
        login = self.client.post("/api/auth/token/", {"email": buyer.email, "password": "buyer1234"}, format="json")
        token = login.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        payload = {
            "title": "Vintage radio",
            "description": "Radio from 70s",
            "price_uah": "1200.00",
            "category": "tech",
            "decade": "70s",
            "condition": "good",
            "image_urls": ["https://picsum.photos/seed/radio/600/400"],
        }
        response = self.client.post("/api/lots/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_seller_can_create_and_archive_own_lot(self):
        seller = User.objects.create_user(username="seller", email="seller@test.com", password="seller1234")
        Profile.objects.create(user=seller, role="seller")
        login = self.client.post("/api/auth/token/", {"email": seller.email, "password": "seller1234"}, format="json")
        token = login.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        payload = {
            "title": "Vintage chair",
            "description": "Restored chair from 80s",
            "price_uah": "3400.00",
            "category": "furniture",
            "decade": "80s",
            "condition": "good",
            "image_urls": ["https://picsum.photos/seed/chair/600/400"],
        }
        create_response = self.client.post("/api/lots/", payload, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        lot = Lot.objects.get(id=create_response.data["id"])
        archive_response = self.client.patch(f"/api/lots/{lot.id}/archive/", {}, format="json")
        self.assertEqual(archive_response.status_code, status.HTTP_200_OK)
        lot.refresh_from_db()
        self.assertEqual(lot.status, "archived")

    def test_catalog_search_and_seller_page(self):
        seller = User.objects.create_user(username="seller2", email="seller2@test.com", password="seller1234")
        Profile.objects.create(user=seller, role="seller")
        lot = Lot.objects.create(
            seller=seller,
            title="Vintage camera",
            description="Film camera",
            price_uah="5000.00",
            category="tech",
            decade="70s",
            condition="good",
            status="active",
            tags="camera,film",
        )
        list_response = self.client.get("/api/lots/?sort=price_asc")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        search_response = self.client.get("/api/lots/search/?q=cam")
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        seller_response = self.client.get(f"/api/sellers/{seller.id}/")
        self.assertEqual(seller_response.status_code, status.HTTP_200_OK)
        self.assertEqual(seller_response.data["seller"]["id"], seller.id)
        self.assertEqual(lot.title, "Vintage camera")

    def test_buyer_cart_checkout_and_complete_flow(self):
        seller = User.objects.create_user(username="seller3", email="seller3@test.com", password="seller1234")
        Profile.objects.create(user=seller, role="seller")
        buyer = User.objects.create_user(username="buyer3", email="buyer3@test.com", password="buyer1234")
        Profile.objects.create(user=buyer, role="buyer")
        lot = Lot.objects.create(
            seller=seller,
            title="Vintage watch",
            description="Mechanical watch",
            price_uah="2300.00",
            category="accessories",
            decade="60s",
            condition="good",
            status="active",
            tags="watch,retro",
        )
        login = self.client.post("/api/auth/token/", {"email": buyer.email, "password": "buyer1234"}, format="json")
        token = login.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        add_response = self.client.post("/api/cart/", {"lot_id": lot.id, "quantity": 1}, format="json")
        self.assertEqual(add_response.status_code, status.HTTP_200_OK)
        checkout_payload = {
            "recipient_full_name": "Buyer Three",
            "phone": "+380501234567",
            "city": "Kyiv",
            "postal_operator": "nova_poshta",
            "delivery_point": "Branch 1",
        }
        checkout_response = self.client.post("/api/checkout/", checkout_payload, format="json")
        self.assertEqual(checkout_response.status_code, status.HTTP_201_CREATED)
        order_id = checkout_response.data["id"]
        complete_response = self.client.patch(f"/api/orders/{order_id}/complete/", {}, format="json")
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
