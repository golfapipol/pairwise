from playwright.sync_api import sync_playwright, Page, expect

def setup_step(page: Page, step_name: str, values: list[dict]):
    # Use a more specific and direct locator for the step name inputs
    step_name_inputs = page.locator("input.font-semibold.text-lg")

    # Get the count of steps before adding a new one
    initial_step_count = step_name_inputs.count()

    # Click "Add Step"
    page.get_by_role("button", name="Add Step").click()

    # Wait for the number of step inputs to increase by one
    expect(step_name_inputs).to_have_count(initial_step_count + 1, timeout=5000)

    # Get the newly added step input (the last one)
    new_step_input = step_name_inputs.last

    # Verify its default name
    expect(new_step_input).to_have_value(f"Step {initial_step_count + 1}")

    # Now fill it with the desired name
    new_step_input.fill(step_name)

    # Find the parent card of this new input to scope the rest of the actions
    step_card = new_step_input.locator("xpath=ancestor::div[contains(@class, 'min-w-[300px]')]")

    for value_info in values:
        # Click "Add Value" within the correct card
        step_card.get_by_role("button", name="Add Value").click()

        # Fill the new input value. Target the last one within the card.
        new_value_input = step_card.get_by_placeholder("Enter value...").last
        expect(new_value_input).to_be_visible() # Wait for it to be visible
        new_value_input.fill(value_info["value"])

        # Find the specific row for this new value within the card
        value_row = step_card.locator(f"div.flex:has(input[value='{value_info['value']}'])")

        # Select the color by clicking the combobox and then the option
        value_row.get_by_role("combobox").click()
        page.get_by_role("option", name=value_info["color_label"], exact=True).click()


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000", wait_until="domcontentloaded")

        # Wait for the main heading to be visible to ensure the page is loaded
        expect(page.get_by_role("heading", name="Pairwise Testing Tool")).to_be_visible()

        # Create Step 1
        setup_step(page, "Step 1", [
            {"value": "1.1", "color_label": "Green"},
            {"value": "1.2", "color_label": "Red"}
        ])

        # Create Step 2
        setup_step(page, "Step 2", [
            {"value": "2.1", "color_label": "Green"},
            {"value": "2.2", "color_label": "Yellow"}
        ])

        # Generate combinations
        page.get_by_role("button", name="Generate Pairwise Combinations").click()

        # Wait for the results table to appear
        results_heading = page.get_by_role("heading", name="Pairwise Test Combinations")
        expect(results_heading).to_be_visible()

        # Take screenshot of the results card
        results_card = page.locator("table.w-full").last.locator("xpath=../..")
        results_card.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run()
