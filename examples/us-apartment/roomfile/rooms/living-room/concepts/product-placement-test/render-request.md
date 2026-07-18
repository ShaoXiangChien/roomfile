# Banana render brief

Generated from `/Users/ericchien/Documents/Interior Design/examples/us-apartment/roomfile/rooms/living-room/concepts/product-placement-test/render-request.json`. The JSON request remains the source of truth.

## Provider contract

- Adapter: banana
- Concept: product-placement-test v1
- Output: `/Users/ericchien/Documents/Interior Design/examples/us-apartment/roomfile/rooms/living-room/assets/generated/ikea-stockholm-placement.png`
- Continuity: For a refinement, pass the latest valid `previous_interaction_id` to Banana. For the first render, attach the canonical image paths below. Never ask the user to upload a local image again.
- Privacy: for a private project, confirm consent before sending room images to a provider not already approved in the project.

## Canonical inputs

- `/Users/ericchien/Documents/Interior Design/examples/us-apartment/roomfile/rooms/living-room/assets/generated/mid-century-modern-refined.png`

## Provider-ready prompt

Create a photorealistic interior-design visualization using the supplied canonical room image as the architectural source of truth.

Goal: Place an approximate IKEA STOCKHOLM walnut veneer coffee table into the refined Mid-century Modern concept without changing anything else.

Camera and composition: Phone camera at 5 ft height near southwest entry, facing north-northeast, 4:3 landscape. Keep this viewpoint, framing, perspective, lens character, and visible architecture consistent.

You MUST preserve every locked fact exactly:
1. same 4:3 camera position and lens
2. same wall, window, door, radiator, HVAC, outlet, and ceiling-light locations
3. same wood-look flooring
4. same 84 × 36 inch warm-gray sofa
5. same 60 × 36 inch oak dining table
6. same refined textiles, floor lamp, art, decor, plants, lighting, and color balance

Allowed edits only:
1. replace only the existing approximate coffee table with the IKEA STOCKHOLM coffee table appearance

Visible style evidence to express:
1. warm walnut veneer
2. restrained 1960s reference
3. calm neutral base

Product references to depict approximately, without inventing dimensional proof:
1. IKEA STOCKHOLM coffee table, article 702.397.10, 70 7/8 × 23 1/4 inches

Do not move, remove, resize, or redesign locked walls, doors, windows, flooring, ceiling, outlets, radiators, HVAC vents, fixed lighting, retained inventory, or the camera. Do not add permanent construction. Treat product appearance and placement as a visual approximation; structured measurements and Roomfile's fit checker remain authoritative.

No text, watermark, labels, captions, split-screen treatment, people, or impossible geometry in the generated image.

## Metadata to store beside the image

Record this disclaimer in the concept file and user-facing presentation:

> Visual approximation — verify dimensions, color, material, and availability before purchasing.

Do NOT render the disclaimer or any other text inside the image.
