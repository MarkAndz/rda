import { describe, it, vi, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateRestaurantForm from "@/components/restaurants/CreateRestaurantForm";

describe("CreateRestaurantForm", () => {
    it("renders and submits the form", async () => {
        const onClose = vi.fn();

        const fakeRestaurant = { id: "1", name: "Test Restaurant", slug: "test-restaurant" };
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(fakeRestaurant),
            } as Response)
        );

        render(<CreateRestaurantForm onClose={onClose} />);

        fireEvent.change(screen.getByPlaceholderText("Name"), { target: { value: "Test Restaurant" } });
        fireEvent.change(screen.getByPlaceholderText("Address"), { target: { value: "123 Main St" } });
        fireEvent.change(screen.getByPlaceholderText("City"), { target: { value: "Testville" } });
        fireEvent.change(screen.getByPlaceholderText("Country"), { target: { value: "Testland" } });
        fireEvent.change(screen.getByPlaceholderText("Postcode"), { target: { value: "12345" } });

        fireEvent.change(screen.getByPlaceholderText("Latitude"), { target: { value: "51.5" } });
        fireEvent.change(screen.getByPlaceholderText("Time Zone (e.g. Europe/London)"), { target: { value: "Europe/London" } });
        fireEvent.change(screen.getByPlaceholderText("Phone"), { target: { value: "1234567890" } });
        fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByPlaceholderText("Description"), { target: { value: "A test restaurant" } });
        fireEvent.change(screen.getByPlaceholderText("Image URL"), { target: { value: "https://example.com/image.jpg" } });

        fireEvent.click(screen.getByText("Create"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith("/api/restaurants", expect.objectContaining({
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: expect.any(String),
            }));
            expect(onClose).toHaveBeenCalled();
        });

        const body = JSON.parse((fetch as any).mock.calls[0][1].body);
        expect(body.name).toBe("Test Restaurant");
        expect(body.address).toBe("123 Main St");

        vi.restoreAllMocks();
    });
});
