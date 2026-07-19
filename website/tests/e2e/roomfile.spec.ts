import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/docs/getting-started",
  "/docs/commands",
  "/docs/project-files",
  "/docs/rendering",
  "/docs/sourcing",
  "/docs/contributing",
  "/examples",
  "/examples/apartment",
  "/examples/bauhaus-workspace",
  "/examples/japandi-bedroom",
  "/examples/us-apartment",
  "/styles",
  "/styles/mid-century-modern",
  "/styles/bauhaus",
  "/styles/japandi",
];

test("all public routes render without horizontal overflow", async ({ page }) => {
  for (const route of publicRoutes) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBeTruthy();
    await expect(page.locator("main")).toBeVisible();
    const sizes = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(sizes.scroll, `${route} horizontal overflow`).toBeLessThanOrEqual(
      sizes.client + 1,
    );
  }
});

test("homepage supports the design journey interactions", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Design your home, together." }),
  ).toBeVisible();

  const install = page.locator("#install");
  await install.getByRole("button", { name: "Copy" }).click();
  await expect(install.getByRole("button", { name: "Copied" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("npx skills add ShaoXiangChien/roomfile");

  const slider = page.getByRole("slider", {
    name: "Move through the revisions",
  });
  await slider.press("End");
  await expect(slider).toHaveAttribute("aria-valuetext", "Product trial");

  const thirdPin = page.getByRole("button", {
    name: "Show 03, VARMBLIXT table lamp",
  });
  await thirdPin.click();
  await expect(thirdPin).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#product-03")).toHaveClass("active");
});

test("mobile navigation keeps the core paths visible", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
  await page.goto("/");

  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(
    navigation.getByRole("link", { name: "Selected Homes" }),
  ).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Style Atlas" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "GitHub ↗" })).toBeVisible();
});

test("reduced motion removes long transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const motion = await page.locator(".revision-stage img.is-active").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      transitionDuration: style.transitionDuration,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    };
  });
  expect(motion.transitionDuration).toMatch(/1e-05s|0\.00001s|0\.01ms/);
  expect(motion.scrollBehavior).toBe("auto");
});

test("legacy example declares canonical and noindex", async ({ page }) => {
  await page.goto("/examples/us-apartment");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/examples\/apartment$/,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, follow",
  );
});

test("Style Atlas plates keep attribution adjacent and keyboard links visible", async ({ page }) => {
  await page.goto("/styles/mid-century-modern");
  const firstPlate = page.locator(".atlas-plate").first();
  await expect(firstPlate.getByRole("img")).toBeVisible();
  await expect(firstPlate.getByText("What to notice")).toBeVisible();
  const sourceLink = firstPlate.getByRole("link", { name: /source/i });
  await sourceLink.focus();
  await expect(sourceLink).toBeFocused();
  const dimensions = await firstPlate.getByRole("img").evaluate((image) => ({
    width: image.getAttribute("width"),
    height: image.getAttribute("height"),
  }));
  expect(dimensions.width).toBeTruthy();
  expect(dimensions.height).toBeTruthy();
});
