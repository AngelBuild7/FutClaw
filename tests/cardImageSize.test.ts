import { describe, expect, it } from "vitest";
import { CARD_IMAGE_WIDTHS, cardImageHeight, pickCardImageSize } from "@/lib/cardImageSize";

describe("card image sizes", () => {
  it("defaults to medium for missing or invalid values", () => {
    expect(pickCardImageSize(null)).toBe("md");
    expect(pickCardImageSize(undefined)).toBe("md");
    expect(pickCardImageSize("xl")).toBe("md");
    expect(pickCardImageSize("medium")).toBe("md");
  });

  it("accepts supported size variants", () => {
    expect(pickCardImageSize("sm")).toBe("sm");
    expect(pickCardImageSize("lg")).toBe("lg");
  });

  it("keeps the FUT card aspect ratio for every width", () => {
    expect(CARD_IMAGE_WIDTHS).toEqual({ sm: 360, md: 540, lg: 810 });
    expect(cardImageHeight(360)).toBe(547);
    expect(cardImageHeight(540)).toBe(820);
    expect(cardImageHeight(810)).toBe(1230);
  });
});
