import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/restaurants/route";

describe("POST /api/restaurants", () => {
    it("should return 400 if required fields are missing", async () => {
        const req = {
            json: async () => ({ name: "" }),
        } as any;
        const res = await POST(req);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.error).toBeDefined();
    });

    it("should create a restaurant with valid data", async () => {
        const req = {
            json: async () => ({
                name: "Test Restaurant",
                address: "123 Main St",
                city: "Testville",
                country: "Testland",
                postcode: "12345",
                latitude: 51.5,
                timezone: "Europe/London",
                phone: "1234567890",
                email: "test@example.com",
                description: "A test restaurant",
                imageUrl: "https://example.com/image.jpg"
            }),
        } as any;
        const res = await POST(req);
        const data = await res.json();
        expect(res.status).toBe(201);
        expect(data.name).toBe("Test Restaurant");
        expect(data.slug).toBe("test-restaurant");
    });
});