import { describe, expect, it } from "vitest";
import { normalizeText, numberToWords } from "../src/g2p/text-normalize";

describe("numberToWords", () => {
  it("converts 0", () => {
    expect(numberToWords(0)).toBe("zero");
  });

  it("converts single digits", () => {
    expect(numberToWords(1)).toBe("one");
    expect(numberToWords(5)).toBe("five");
    expect(numberToWords(9)).toBe("nine");
  });

  it("converts teens", () => {
    expect(numberToWords(10)).toBe("ten");
    expect(numberToWords(11)).toBe("eleven");
    expect(numberToWords(15)).toBe("fifteen");
    expect(numberToWords(19)).toBe("nineteen");
  });

  it("converts tens", () => {
    expect(numberToWords(20)).toBe("twenty");
    expect(numberToWords(42)).toBe("forty two");
    expect(numberToWords(99)).toBe("ninety nine");
  });

  it("converts hundreds", () => {
    expect(numberToWords(100)).toBe("one hundred");
    expect(numberToWords(142)).toBe("one hundred forty two");
    expect(numberToWords(999)).toBe("nine hundred ninety nine");
  });

  it("converts thousands", () => {
    expect(numberToWords(1000)).toBe("one thousand");
    expect(numberToWords(1234)).toBe("one thousand two hundred thirty four");
    expect(numberToWords(10000)).toBe("ten thousand");
    expect(numberToWords(99999)).toBe("ninety nine thousand nine hundred ninety nine");
  });

  it("converts millions", () => {
    expect(numberToWords(1000000)).toBe("one million");
    expect(numberToWords(1234567)).toBe(
      "one million two hundred thirty four thousand five hundred sixty seven"
    );
  });

  it("converts hundreds of millions", () => {
    expect(numberToWords(100000000)).toBe("one hundred million");
    expect(numberToWords(999999999)).toBe(
      "nine hundred ninety nine million nine hundred ninety nine thousand nine hundred ninety nine"
    );
  });
});

describe("normalizeText", () => {
  describe("numbers", () => {
    it("converts numbers in context", () => {
      expect(normalizeText("I have 142 cats")).toBe("i have one hundred forty two cats");
    });

    it("converts thousands", () => {
      expect(normalizeText("there are 1000 people")).toBe("there are one thousand people");
    });

    it("converts large numbers", () => {
      expect(normalizeText("I counted 1234")).toBe(
        "i counted one thousand two hundred thirty four"
      );
    });

    it("converts one million", () => {
      expect(normalizeText("a million is 1000000")).toBe("a million is one million");
    });

    it("converts two-digit numbers", () => {
      expect(normalizeText("room 42")).toBe("room forty two");
    });

    it("converts zero", () => {
      expect(normalizeText("0 degrees")).toBe("zero degrees");
    });

    it("converts decimal numbers", () => {
      expect(normalizeText("pi is 3.14")).toBe("pi is three point one four");
      expect(normalizeText("value 1,234.56")).toBe(
        "value one thousand two hundred thirty four point five six"
      );
    });
  });

  describe("currency", () => {
    it("converts whole-dollar amounts", () => {
      expect(normalizeText("$1")).toBe("one dollar");
      expect(normalizeText("$12")).toBe("twelve dollars");
    });

    it("converts dollars and cents", () => {
      expect(normalizeText("$1.01")).toBe("one dollar and one cent");
      expect(normalizeText("$2.50")).toBe("two dollars and fifty cents");
    });

    it("converts cents-only amounts when dollars are zero", () => {
      expect(normalizeText("$0.99")).toBe("ninety nine cents");
      expect(normalizeText("$0.01")).toBe("one cent");
    });

    it("converts comma-grouped dollar amounts", () => {
      expect(normalizeText("$1,234.56")).toBe(
        "one thousand two hundred thirty four dollars and fifty six cents"
      );
    });
  });

  describe("time and date", () => {
    it("converts times with explicit meridiem", () => {
      expect(normalizeText("meet at 3:05 pm")).toBe("meet at three oh five p m");
      expect(normalizeText("alarm at 9:00am")).toBe("alarm at nine o'clock a m");
    });

    it("converts 24-hour times to inferred 12-hour speech", () => {
      expect(normalizeText("depart 14:30")).toBe("depart two thirty p m");
      expect(normalizeText("start 00:15")).toBe("start twelve fifteen a m");
    });

    it("converts slash dates", () => {
      expect(normalizeText("on 12/25/2024")).toBe("on december twenty fifth two thousand twenty four");
    });

    it("converts iso dates", () => {
      expect(normalizeText("deadline 2026-02-27")).toBe(
        "deadline february twenty seventh two thousand twenty six"
      );
    });
  });

  describe("ordinals", () => {
    it("converts 1st", () => {
      expect(normalizeText("the 1st time")).toBe("the first time");
    });

    it("converts 2nd", () => {
      expect(normalizeText("the 2nd place")).toBe("the second place");
    });

    it("converts 3rd", () => {
      expect(normalizeText("the 3rd attempt")).toBe("the third attempt");
    });

    it("converts 4th", () => {
      expect(normalizeText("the 4th wall")).toBe("the fourth wall");
    });

    it("converts 21st", () => {
      expect(normalizeText("the 21st century")).toBe("the twenty first century");
    });
  });

  describe("abbreviations", () => {
    it("expands Dr.", () => {
      expect(normalizeText("Dr. Smith")).toBe("doctor smith");
    });

    it("expands Mr.", () => {
      expect(normalizeText("Mr. Jones")).toBe("mister jones");
    });

    it("expands Mrs.", () => {
      expect(normalizeText("Mrs. Brown")).toBe("missus brown");
    });

    it("expands St.", () => {
      expect(normalizeText("St. Louis")).toBe("saint louis");
    });

    it("expands Ave.", () => {
      expect(normalizeText("5th Ave.")).toBe("fifth avenue");
    });

    it("expands dotted initialisms", () => {
      expect(normalizeText("U.S. policy")).toBe("u s policy");
      expect(normalizeText("U.S.A. today")).toBe("u s a today");
      expect(normalizeText("C.D.S briefing")).toBe("c d s briefing");
    });
  });

  describe("edge cases", () => {
    it("handles empty string", () => {
      expect(normalizeText("")).toBe("");
    });

    it("handles plain text", () => {
      expect(normalizeText("hello world")).toBe("hello world");
    });

    it("handles punctuation-only input", () => {
      expect(normalizeText("...")).toBe(". . .");
    });

    it("lowercases text", () => {
      expect(normalizeText("HELLO")).toBe("hello");
    });

    it("preserves apostrophes in contractions", () => {
      expect(normalizeText("it's fine")).toBe("it's fine");
    });
  });

  describe("punctuation handling", () => {
    it("preserves commas and exclamation marks as separate tokens", () => {
      expect(normalizeText("Hello, world!")).toBe("hello , world !");
    });

    it("preserves periods as separate tokens", () => {
      expect(normalizeText("end. start")).toBe("end . start");
    });

    it("preserves question marks as separate tokens", () => {
      expect(normalizeText("really?")).toBe("really ?");
    });

    it("preserves semicolons and colons as separate tokens", () => {
      expect(normalizeText("stop; go")).toBe("stop ; go");
      expect(normalizeText("note: important")).toBe("note : important");
    });

    it("strips non-pause punctuation (quotes, parens, brackets)", () => {
      expect(normalizeText("(hello)")).toBe("hello");
      expect(normalizeText('"hello"')).toBe("hello");
      expect(normalizeText("[test]")).toBe("test");
    });

    it("preserves apostrophes in contractions", () => {
      expect(normalizeText("it's fine")).toBe("it's fine");
      expect(normalizeText("don't stop")).toBe("don't stop");
    });

    it("preserves trailing apostrophes for colloquial elision spellings", () => {
      expect(normalizeText("comin' home")).toBe("comin' home");
      expect(normalizeText("ol' friend")).toBe("ol' friend");
    });

    it("preserves multiple internal apostrophes in one token", () => {
      expect(normalizeText("rock'n'roll forever")).toBe("rock'n'roll forever");
    });
  });
});
