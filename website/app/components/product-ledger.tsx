"use client";

import { useState } from "react";

const products = [
  {
    id: "01",
    name: "STOCKHOLM coffee table",
    source: "IKEA · 702.397.10",
    price: "$449.99",
    dimensions: '70⅞ × 23¼ × 15¾"',
    fit: "Passed",
    status: "Selected",
    href: "https://www.ikea.com/us/en/p/stockholm-coffee-table-walnut-veneer-70239710/",
    position: { left: "50%", top: "69%" },
  },
  {
    id: "02",
    name: "FJÄLLBO shelf unit",
    source: "IKEA · 503.392.92",
    price: "$149.00",
    dimensions: '39⅜ × 14⅛ × 37⅜"',
    fit: "Passed",
    status: "Alternative",
    href: "https://www.ikea.com/us/en/p/fjaellbo-shelf-unit-black-50339292/",
    position: { left: "67%", top: "50%" },
  },
  {
    id: "03",
    name: "VARMBLIXT table lamp",
    source: "IKEA · 905.251.50",
    price: "$99.99",
    dimensions: '12" diameter',
    fit: "Surface check",
    status: "Alternative",
    href: "https://www.ikea.com/us/en/p/varmblixt-led-table-wall-lamp-orange-glass-round-90525150/",
    position: { left: "83%", top: "52%" },
  },
  {
    id: "04",
    name: "LAUTERS floor lamp",
    source: "IKEA · 004.050.48",
    price: "$79.99",
    dimensions: '24" base · 47–59" H',
    fit: "Passed",
    status: "Alternative",
    href: "https://www.ikea.com/us/en/p/lauters-floor-lamp-ash-white-00405048/",
    position: { left: "14%", top: "43%" },
  },
  {
    id: "05",
    name: "Patterned wool rug",
    source: "Open sourcing brief",
    price: "Budget $350",
    dimensions: '8 × 10\' target',
    fit: "Footprint set",
    status: "Source next",
    href: "/docs/sourcing",
    position: { left: "54%", top: "84%" },
  },
  {
    id: "06",
    name: "Amazon Basics air purifier",
    source: "Amazon · B0CL993435",
    price: "$65.09*",
    dimensions: '9.6 × 9.6 × 14.3"',
    fit: "Outlet check",
    status: "Recheck",
    href: "https://us.amazon.com/Amazon-Basics-Purifier-Bedroom-Allergies/dp/B0CL993435",
    position: { left: "59%", top: "57%" },
  },
] as const;

export function ProductLedger() {
  const [active, setActive] = useState("01");

  return (
    <div className="ledger-composition">
      <div className="annotated-room">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/examples/apartment/ikea-stockholm-placement.webp"
          alt="Finished Mid-century Modern living room annotated with six product references"
        />
        {products.map((product) => (
          <button
            className={active === product.id ? "product-pin active" : "product-pin"}
            style={product.position}
            type="button"
            key={product.id}
            aria-label={`Show ${product.id}, ${product.name}`}
            aria-controls={`product-${product.id}`}
            aria-pressed={active === product.id}
            onClick={() => setActive(product.id)}
            onFocus={() => setActive(product.id)}
            onMouseEnter={() => setActive(product.id)}
          >
            {product.id}
          </button>
        ))}
        <p>Placement render · fit checked separately</p>
      </div>

      <div className="product-ledger">
        <div className="ledger-title">
          <p className="eyebrow">Product ledger</p>
          <span>Checked 19 Jul 2026</span>
        </div>
        <div className="ledger-scroll">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Source</th>
                <th>Price</th>
                <th>Size</th>
                <th>Fit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  className={active === product.id ? "active" : ""}
                  id={`product-${product.id}`}
                  key={product.id}
                  onMouseEnter={() => setActive(product.id)}
                >
                  <td>
                    <button type="button" onFocus={() => setActive(product.id)} onClick={() => setActive(product.id)}>
                      <span>{product.id}</span>
                      {product.name}
                    </button>
                  </td>
                  <td>
                    <a href={product.href}>{product.source}</a>
                  </td>
                  <td>{product.price}</td>
                  <td>{product.dimensions}</td>
                  <td>{product.fit}</td>
                  <td>
                    <strong data-status={product.status}>{product.status}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ledger-note">
          *Shown as an archived research value. Price, seller, stock, and delivery
          are rechecked before a decision becomes approved.
        </p>
      </div>
    </div>
  );
}
