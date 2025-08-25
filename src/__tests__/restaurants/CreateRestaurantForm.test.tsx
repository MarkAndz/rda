import { describe, it, vi, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CreateRestaurantForm from "@/components/restaurants/CreateRestaurantForm";

describe("CreateRestaurantForm", () => {
    it("renders and submits the form", () => {
        const onClose = vi.fn();
        const alertMock = vi.spyOn(window, "alert").mockImplementation(() => { });

        render(<CreateRestaurantForm onClose={onClose} />);

        // Fill out required fields
        fireEvent.change(screen.getByPlaceholderText("Name"), {
            target: { value: "Test Restaurant" },
        });
        fireEvent.change(screen.getByPlaceholderText("Address"), {
            target: { value: "123 Main St" },
        });
        fireEvent.change(screen.getByPlaceholderText("City"), {
            target: { value: "Testville" },
        });
        fireEvent.change(screen.getByPlaceholderText("Country"), {
            target: { value: "Testland" },
        });
        fireEvent.change(screen.getByPlaceholderText("Postcode"), {
            target: { value: "12345" },
        });

        // Optional fields
        fireEvent.change(screen.getByPlaceholderText("Latitude"), {
            target: { value: "51.5" },
        });
        fireEvent.change(screen.getByPlaceholderText("Time Zone (e.g. Europe/London)"), {
            target: { value: "Europe/London" },
        });
        fireEvent.change(screen.getByPlaceholderText("Phone"), {
            target: { value: "1234567890" },
        });
        fireEvent.change(screen.getByPlaceholderText("Email"), {
            target: { value: "test@example.com" },
        });
        fireEvent.change(screen.getByPlaceholderText("Description"), {
            target: { value: "A test restaurant" },
        });
        fireEvent.change(screen.getByPlaceholderText("Image URL"), {
            target: { value: "https://example.com/image.jpg" },
        });

        // Submit the form
        fireEvent.click(screen.getByText("Create"));

        // Expect alert to have been called
        expect(alertMock).toHaveBeenCalledWith("Creating restaurant: Test Restaurant");

        // Expect onClose callback to be called
        expect(onClose).toHaveBeenCalled();

        // Clean up
        alertMock.mockRestore();
    });
});
