const VERSION = "velura-pricing-2026-06";

const serviceDefinitions = {
  eot: {
    label: "End of Tenancy",
    description: "Checklist-led move-out or move-in clean for flats and houses."
  },
  deep_clean: {
    label: "Deep Clean",
    description: "Detailed reset clean for kitchens, bathrooms, living spaces, trims, glass, and touchpoints."
  },
  regular: {
    label: "Regular Clean",
    description: "Weekly, fortnightly, or monthly care priced per visit."
  },
  turnover: {
    label: "Airbnb Turnover",
    description: "Short-stay reset with presentation details and optional linen support."
  },
  office: {
    label: "Office Clean",
    description: "Commercial workspace clean priced by area and condition."
  },
  commercial: {
    label: "Commercial Clean",
    description: "Commercial premises cleaning with washrooms, shared areas, desks, bins, and internal glass."
  },
  emergency: {
    label: "Emergency Clean",
    description: "Priority deep clean for same-day or urgent recovery work."
  },
  student: {
    label: "Student / HMO",
    description: "Higher-use property reset based on end-of-tenancy scope."
  }
};

const propertyTypes = {
  studio: "Studio",
  flat: "Flat",
  house: "House",
  office: "Office / workspace"
};

const conditionOptions = {
  good: {
    label: "Good",
    multiplier: 1,
    description: "Light build-up and normal use."
  },
  average: {
    label: "Average",
    multiplier: 1.15,
    description: "Noticeable build-up or extra time needed."
  },
  soiled: {
    label: "Heavy build-up",
    multiplier: 1.35,
    description: "Heavy dirt, limescale, grease, or longer recovery work."
  }
};

const urgencyOptions = {
  standard: {
    label: "Standard",
    multiplier: 1
  },
  same_day: {
    label: "Same-day / urgent",
    multiplier: 1.2
  }
};

const frequencyOptions = {
  one_off: {
    label: "One-off",
    multiplier: 1
  },
  weekly: {
    label: "Weekly",
    multiplier: 1
  },
  fortnightly: {
    label: "Fortnightly",
    multiplier: 0.95
  },
  monthly: {
    label: "Monthly",
    multiplier: 0.9
  }
};

const addOns = {
  carpet_steam: {
    label: "Carpet steam clean",
    unit: "room",
    price: 45,
    category: "domestic",
    duration: 0.5
  },
  oven_deep: {
    label: "Oven deep clean",
    unit: "clean",
    price: 40,
    category: "domestic",
    duration: 0.5
  },
  fridge: {
    label: "Fridge clean",
    unit: "clean",
    price: 15,
    category: "domestic",
    duration: 0.25
  },
  balcony: {
    label: "Balcony clean",
    unit: "clean",
    price: 35,
    category: "domestic",
    duration: 0.5
  },
  cupboards: {
    label: "Inside cupboards",
    unit: "clean",
    price: 20,
    category: "domestic",
    duration: 0.5
  },
  wall_spot: {
    label: "Wall spot cleaning",
    unit: "clean",
    price: 25,
    category: "domestic",
    duration: 0.5
  },
  exterior_windows: {
    label: "External window clean",
    unit: "clean",
    price: 45,
    category: "domestic",
    duration: 0.5
  },
  linen: {
    label: "Linen change",
    unit: "bed",
    price: 10,
    category: "domestic",
    duration: 0.25
  },
  washroom_sanitise: {
    label: "Washroom sanitising",
    unit: "area",
    price: 25,
    category: "commercial",
    duration: 0.35
  },
  desk_sanitise: {
    label: "Desk and touchpoint sanitising",
    unit: "area",
    price: 20,
    category: "commercial",
    duration: 0.35
  },
  internal_glass: {
    label: "Internal glass and partitions",
    unit: "area",
    price: 30,
    category: "commercial",
    duration: 0.4
  },
  waste_bag_change: {
    label: "Bin liner and waste reset",
    unit: "area",
    price: 15,
    category: "commercial",
    duration: 0.25
  },
  consumables_restock: {
    label: "Consumables restock",
    unit: "visit",
    price: 20,
    category: "commercial",
    duration: 0.25
  },
  kitchen_point_clean: {
    label: "Staff kitchen point clean",
    unit: "area",
    price: 25,
    category: "commercial",
    duration: 0.35
  },
  floor_machine: {
    label: "Machine floor clean",
    unit: "area",
    price: 60,
    category: "commercial",
    duration: 0.75
  }
};

const inspectionItems = ["Rug cleaning", "Upholstery", "Garden work", "Heavy build-up beyond normal scope"];

const pricing = {
  eot: {
    flat: {
      0: 190,
      1: 190,
      2: 245,
      3: 310,
      4: 395
    },
    house: {
      1: 195,
      2: 255,
      3: 315,
      4: 405
    }
  },
  deep_clean: {
    flat: {
      0: [180, 205],
      1: [190, 215],
      2: [240, 270],
      3: [285, 325],
      4: [345, 385]
    },
    house: {
      1: [190, 215],
      2: [245, 275],
      3: [295, 335],
      4: [355, 395]
    }
  },
  regular: {
    flat: {
      0: [85, 105],
      1: [95, 115],
      2: [120, 140],
      3: [145, 165],
      4: [175, 195]
    },
    house: {
      1: [95, 115],
      2: [125, 145],
      3: [150, 170],
      4: [180, 200]
    }
  },
  turnover: {
    flat: {
      0: [75, 105],
      1: [75, 105],
      2: [95, 130],
      3: [135, 190],
      4: [165, 220]
    },
    house: {
      1: [85, 115],
      2: [110, 145],
      3: [150, 205],
      4: [185, 240]
    }
  }
};

export const serviceTypeKeys = Object.keys(serviceDefinitions);
export const propertyTypeKeys = Object.keys(propertyTypes);
export const conditionKeys = Object.keys(conditionOptions);
export const urgencyKeys = Object.keys(urgencyOptions);
export const frequencyKeys = Object.keys(frequencyOptions);
export const addOnKeys = Object.keys(addOns);

function money(pounds) {
  return Math.round(pounds * 100);
}

function fromMoney(pennies) {
  return Math.round(pennies) / 100;
}

function formatMoney(pennies) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0
  }).format(fromMoney(pennies));
}

function formatRange(minPennies, maxPennies) {
  if (minPennies === null || maxPennies === null) {
    return "Quoted after inspection";
  }

  return minPennies === maxPennies ? formatMoney(minPennies) : `${formatMoney(minPennies)}-${formatMoney(maxPennies)}`;
}

function clampNumber(value, min, max) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return min;
  }

  return Math.min(Math.max(parsed, min), max);
}

function normalizeBedrooms(value) {
  return clampNumber(value, 0, 5);
}

function normalizeBathrooms(value) {
  return clampNumber(value, 1, 8);
}

function propertyGroup(propertyType) {
  if (propertyType === "house") {
    return "house";
  }

  return "flat";
}

function propertyLabel(propertyType, bedrooms, serviceType) {
  if (serviceType === "office" || serviceType === "commercial") {
    return `${bedrooms === 0 ? "Small" : bedrooms} ${bedrooms === 1 ? "workspace area" : "workspace areas"}`;
  }

  if (bedrooms === 0 || propertyType === "studio") {
    return "Studio";
  }

  return `${bedrooms} bedroom ${propertyTypes[propertyType] || "property"}`.trim();
}

function bedroomLabel(bedrooms) {
  return bedrooms === 0 ? "Studio" : `${bedrooms}${bedrooms >= 5 ? "+" : ""} bed`;
}

function makeRange(value) {
  if (Array.isArray(value)) {
    return {
      min: money(value[0]),
      max: money(value[1])
    };
  }

  return {
    min: money(value),
    max: money(value)
  };
}

function emptyInspectionQuote(payload, reason) {
  const bedrooms = normalizeBedrooms(payload.bedrooms);
  const service = serviceDefinitions[payload.serviceType] || serviceDefinitions.eot;

  return {
    pricingVersion: VERSION,
    serviceType: payload.serviceType,
    serviceLabel: service.label,
    propertyType: payload.propertyType,
    propertyLabel: propertyLabel(payload.propertyType, bedrooms, payload.serviceType),
    bedrooms,
    bathrooms: normalizeBathrooms(payload.bathrooms),
    minPricePennies: null,
    maxPricePennies: null,
    midpointPricePennies: null,
    minPrice: null,
    maxPrice: null,
    midpointPrice: null,
    displayPrice: "Quoted after inspection",
    estimatedDurationHours: null,
    needsInspection: true,
    caveat: reason,
    breakdown: []
  };
}

function getBaseQuote({ serviceType, propertyType, bedrooms, frequency }) {
  const group = propertyGroup(propertyType);
  const safeBedrooms = group === "house" ? Math.max(1, bedrooms) : bedrooms;

  if (["eot", "student", "deep_clean", "regular", "turnover", "emergency"].includes(serviceType) && bedrooms >= 5) {
    return null;
  }

  if (serviceType === "office" || serviceType === "commercial") {
    const areas = Math.max(0, bedrooms);
    const base = Math.max(150, 100 + areas * 50);
    const multiplier = serviceType === "commercial" ? 1.25 : 1;

    return {
      range: {
        min: money(Math.round(base * multiplier)),
        max: money(Math.round((base + 80) * multiplier))
      },
      duration: 2 + areas * (serviceType === "commercial" ? 1 : 0.75),
      label: `${serviceDefinitions[serviceType].label} base`
    };
  }

  if (serviceType === "student") {
    const base = pricing.eot[group]?.[safeBedrooms];

    if (!base) {
      return null;
    }

    return {
      range: makeRange(Math.round(base * 1.1)),
      duration: 4 + safeBedrooms * 0.75,
      label: "Student / HMO base"
    };
  }

  if (serviceType === "emergency") {
    const base = pricing.deep_clean[group]?.[safeBedrooms];

    if (!base) {
      return null;
    }

    return {
      range: makeRange(base),
      duration: 3 + safeBedrooms * 0.75,
      label: "Emergency clean base"
    };
  }

  if (serviceType === "regular") {
    const base = pricing.regular[group]?.[safeBedrooms];

    if (!base) {
      return null;
    }

    const multiplier = frequencyOptions[frequency]?.multiplier || 1;
    const adjusted = multiplyRange(makeRange(base), multiplier);

    return {
      range: adjusted,
      duration: 2 + safeBedrooms * 0.35,
      label: `${frequencyOptions[frequency]?.label || "Regular"} regular clean`
    };
  }

  const baseSource = serviceType === "eot" ? pricing.eot : pricing[serviceType];
  const base = baseSource?.[group]?.[safeBedrooms];

  if (!base) {
    return null;
  }

  return {
    range: makeRange(base),
    duration:
      serviceType === "eot"
        ? 3.5 + safeBedrooms * 0.8
        : serviceType === "turnover"
            ? 1.5 + safeBedrooms * 0.35
            : 2.5 + safeBedrooms * 0.75,
    label: `${serviceDefinitions[serviceType].label} base`
  };
}

function addLine(breakdown, label, detail, minPennies, maxPennies = minPennies) {
  breakdown.push({
    label,
    detail,
    minPricePennies: minPennies,
    maxPricePennies: maxPennies,
    displayPrice: formatRange(minPennies, maxPennies)
  });
}

function addFixed(range, amountPennies) {
  return {
    min: range.min + amountPennies,
    max: range.max + amountPennies
  };
}

function multiplyRange(range, multiplier) {
  return {
    min: Math.round(range.min * multiplier),
    max: Math.round(range.max * multiplier)
  };
}

export function calculateQuote(payload) {
  const serviceType = payload.serviceType || "eot";
  const bedrooms = normalizeBedrooms(payload.bedrooms);
  const bathrooms = normalizeBathrooms(payload.bathrooms);
  const propertyType = serviceType === "office" || serviceType === "commercial" ? "office" : payload.propertyType || "flat";
  const condition = conditionOptions[payload.condition] ? payload.condition : "good";
  const urgency = urgencyOptions[payload.urgency] ? payload.urgency : "standard";
  const frequency = frequencyOptions[payload.frequency] ? payload.frequency : "one_off";
  const selectedAddOns = Array.isArray(payload.addOns) ? payload.addOns.filter((key) => addOns[key]) : [];
  const baseQuote = getBaseQuote({ serviceType, propertyType, bedrooms, frequency });

  if (!baseQuote) {
    return emptyInspectionQuote(
      { ...payload, serviceType, propertyType, bedrooms, bathrooms },
      "5+ bedroom properties, very large spaces, and specialist work are priced after a quick inspection or photo review."
    );
  }

  const service = serviceDefinitions[serviceType] || serviceDefinitions.eot;
  const breakdown = [];
  let range = baseQuote.range;
  let duration = baseQuote.duration;

  addLine(breakdown, baseQuote.label, propertyLabel(propertyType, bedrooms, serviceType), range.min, range.max);

  if (conditionOptions[condition].multiplier !== 1) {
    const adjusted = multiplyRange(range, conditionOptions[condition].multiplier);
    addLine(
      breakdown,
      `${conditionOptions[condition].label} condition adjustment`,
      conditionOptions[condition].description,
      adjusted.min - range.min,
      adjusted.max - range.max
    );
    range = adjusted;
    duration += condition === "soiled" ? 1 : 0.5;
  }

  if (!["office", "commercial"].includes(serviceType) && bathrooms > 2) {
    const extraBathrooms = bathrooms - 2;
    const amount = money(extraBathrooms * 30);
    addLine(breakdown, "Additional bathrooms", `${extraBathrooms} extra`, amount);
    range = addFixed(range, amount);
    duration += extraBathrooms * 0.35;
  }

  selectedAddOns.forEach((key) => {
    const addOn = addOns[key];
    const quantity =
      key === "carpet_steam"
        ? clampNumber(payload.carpetRooms, 1, 10)
        : key === "linen"
          ? clampNumber(payload.linenSets || bedrooms || 1, 1, 10)
          : addOn.category === "commercial" && addOn.unit === "area"
            ? clampNumber(payload.addOnAreas, 1, 10)
          : 1;
    const amount = money(addOn.price * quantity);
    const detail = quantity > 1 ? `${quantity} ${addOn.unit}s` : `1 ${addOn.unit}`;

    addLine(breakdown, addOn.label, detail, amount);
    range = addFixed(range, amount);
    duration += addOn.duration * quantity;
  });

  const urgencyMultiplier = serviceType === "emergency" ? urgencyOptions.same_day.multiplier : urgencyOptions[urgency].multiplier;

  if (urgencyMultiplier !== 1) {
    const adjusted = multiplyRange(range, urgencyMultiplier);
    addLine(breakdown, "Priority scheduling", "Same-day or urgent work", adjusted.min - range.min, adjusted.max - range.max);
    range = adjusted;
    duration += 0.5;
  }

  const midpoint = Math.round((range.min + range.max) / 2);

  return {
    pricingVersion: VERSION,
    serviceType,
    serviceLabel: service.label,
    propertyType,
    propertyLabel: propertyLabel(propertyType, bedrooms, serviceType),
    bedrooms,
    bathrooms,
    minPricePennies: range.min,
    maxPricePennies: range.max,
    midpointPricePennies: midpoint,
    minPrice: formatMoney(range.min),
    maxPrice: formatMoney(range.max),
    midpointPrice: formatMoney(midpoint),
    displayPrice: formatRange(range.min, range.max),
    estimatedDurationHours: Math.max(1, Math.round(duration * 2) / 2),
    needsInspection: false,
    caveat: "This is a guide estimate. The confirmed price may change after photos, access, parking, property condition, and full scope are reviewed.",
    breakdown
  };
}

function serviceRows(serviceType, group, label, rows) {
  return {
    serviceType,
    group,
    label,
    rows
  };
}

function priceCell(value) {
  if (value === null || value === undefined) {
    return "Inspection";
  }

  const range = makeRange(value);
  return formatRange(range.min, range.max);
}

function bedroomRows(source, group, bedrooms) {
  return bedrooms.map((bedroom) => ({
    bedrooms: bedroomLabel(bedroom),
    price: priceCell(source[group]?.[bedroom])
  }));
}

export function getPricingMatrix() {
  return {
    version: VERSION,
    sourceNote:
      "Velura manager pricing is back on the earlier Velura guide matrix. Regular Clean is shown as a range around the internal average price.",
    services: Object.entries(serviceDefinitions).map(([key, value]) => ({
      key,
      ...value
    })),
    propertyTypes,
    conditionOptions,
    urgencyOptions,
    frequencyOptions,
    priceSections: [
      serviceRows("eot", "flat", "End of Tenancy - Flats", [
        ...bedroomRows(pricing.eot, "flat", [0, 1, 2, 3, 4]),
        { bedrooms: "5+ bed", price: "Inspection" }
      ]),
      serviceRows("eot", "house", "End of Tenancy - Houses", [
        ...bedroomRows(pricing.eot, "house", [1, 2, 3, 4]),
        { bedrooms: "5+ bed", price: "Inspection" }
      ]),
      serviceRows("deep_clean", "flat", "Deep Clean - Flats", [
        ...bedroomRows(pricing.deep_clean, "flat", [0, 1, 2, 3, 4]),
        { bedrooms: "5+ bed", price: "Inspection" }
      ]),
      serviceRows("deep_clean", "house", "Deep Clean - Houses", [
        ...bedroomRows(pricing.deep_clean, "house", [1, 2, 3, 4]),
        { bedrooms: "5+ bed", price: "Inspection" }
      ]),
      serviceRows("regular", "flat", "Regular Clean - Flats", [
        ...bedroomRows(pricing.regular, "flat", [0, 1, 2, 3, 4]),
        { bedrooms: "5+ bed", price: "Inspection" }
      ]),
      serviceRows("regular", "house", "Regular Clean - Houses", [
        ...bedroomRows(pricing.regular, "house", [1, 2, 3, 4]),
        { bedrooms: "5+ bed", price: "Inspection" }
      ]),
      serviceRows("turnover", "flat", "Airbnb Turnover - Flats", [
        ...bedroomRows(pricing.turnover, "flat", [0, 1, 2, 3, 4]),
        { bedrooms: "5+ bed", price: "Inspection" }
      ]),
      serviceRows("turnover", "house", "Airbnb Turnover - Houses", [
        ...bedroomRows(pricing.turnover, "house", [1, 2, 3, 4]),
        { bedrooms: "5+ bed", price: "Inspection" }
      ]),
      serviceRows("office", "office", "Office Clean", [0, 1, 2, 3, 4, 5].map((areas) => {
        const quote = getBaseQuote({ serviceType: "office", propertyType: "office", bedrooms: areas, frequency: "one_off" });
        return {
          bedrooms: areas === 0 ? "Small workspace" : `${areas} work area${areas === 1 ? "" : "s"}`,
          price: formatRange(quote.range.min, quote.range.max)
        };
      })),
      serviceRows("commercial", "office", "Commercial Clean", [0, 1, 2, 3, 4, 5].map((areas) => {
        const quote = getBaseQuote({ serviceType: "commercial", propertyType: "office", bedrooms: areas, frequency: "one_off" });
        return {
          bedrooms: areas === 0 ? "Small premises" : `${areas} commercial area${areas === 1 ? "" : "s"}`,
          price: formatRange(quote.range.min, quote.range.max)
        };
      }))
    ],
    addOns: Object.entries(addOns).map(([key, addOn]) => ({
      key,
      label: addOn.label,
      unit: addOn.unit,
      category: addOn.category || "all",
      price: formatMoney(money(addOn.price)),
      pricePennies: money(addOn.price)
    })),
    rules: [
      "Student / HMO is calculated from End of Tenancy plus 10%.",
      "Emergency Clean is calculated from Deep Clean with a 20% priority uplift.",
      "Commercial Clean is calculated from the office formula with a 25% commercial scope uplift.",
      "Regular Clean is displayed as a guide range around the internal average price.",
      "Average condition adds 15%; heavy build-up adds 35%.",
      "Extra bathrooms over two add £30 each.",
      "Same-day or urgent scheduling adds 20%.",
      "Parking, congestion charges, very large properties, and unusual access can change the confirmed price."
    ],
    inspectionItems
  };
}
