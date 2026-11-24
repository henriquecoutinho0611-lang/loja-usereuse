import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { AppRoutes } from "./AppRoutes";

it("renders only the page registered for the active screen", () => {
  const markup = renderToStaticMarkup(
    <AppRoutes
      screen="cart"
      pages={{
        home: <p>Catálogo</p>,
        cart: <p>Sacola</p>,
      }}
    />,
  );

  expect(markup).toContain("Sacola");
  expect(markup).not.toContain("Catálogo");
});
