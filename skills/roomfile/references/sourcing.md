# Regional product sourcing

Search read-only. Roomfile compares products; it never purchases, adds to cart,
contacts sellers, or uses affiliate links.

## Retailer priority

Use the project-configured region, currency, delivery area, and retailer
preferences. Before searching, require `country` or `region`, `currency`,
`measurement_unit`, and `retailer_strategy`. Ask for missing values and record
them in the manifest.

For `user-preferred`, search the named retailers first. For `agent-suggested`,
propose a short locally available retailer order that covers the required
category, budget, and style evidence, then record that order before continuing.
Use independent or style-specific retailers when the preferred set cannot meet
the role, dimensions, budget, or material requirement.

Use the project ZIP or postal code for delivery or store checks. If
location-specific availability cannot be verified, label it unknown.

## Evidence to capture

For every candidate record: role, product name, retailer, canonical URL,
retrieval date, price and currency, availability, delivery result, seller,
manufacturer, width, depth, height, package dimensions, assembly, return
notes, and the evidence source for dimensions.

When the selected retailer is IKEA, capture the article number. When it is
Amazon, capture the ASIN and current seller. Remove affiliate and tracking
parameters from URLs.

## Verification policy

Do not approve a product without reliable width and depth. Prefer manufacturer
specifications over marketplace copy. When Amazon seller data conflicts with
manufacturer data, keep both, flag the conflict, and use the conservative
dimension for fit checking.

Treat price, stock, seller, shipping, and return policy as volatile. Always
date claims. Flag evidence older than 14 days during audit and re-check it
before final planning.

## Comparison

Compare no more than five strong candidates per role. Show fit result, visual
match, material confidence, delivered price, assembly burden, return risk, and
evidence quality. Retain one alternative for each major furniture category.
