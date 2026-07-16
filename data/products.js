const products = (() => {
  const seeds = {
    computers: { icon: "💻", color: "#2563eb", brands: ["ASUS", "Lenovo", "HP", "Acer"], subs: ["laptops", "gaming-laptops", "desktop-pc", "ssd-drives"], names: ["NovaBook Air 14", "ProWork 16", "Vertex Gaming X", "OfficeBox Mini", "Creator Station", "SwiftBook 15", "Titan Desktop", "Solid SSD 1TB"] },
    electronics: { icon: "📱", color: "#0ea5e9", brands: ["Samsung", "Apple", "Xiaomi", "Sony"], subs: ["iphone", "android-phones", "smart-tv", "headphones"], names: ["Galaxy Nova 5G", "Phone Air 256GB", "Redmi Vision Pro", "Bravia Smart 55", "Wave Buds Pro", "Pocket Power 20K", "Vision Projector", "Active Watch S"] },
    gaming: { icon: "🎮", color: "#7c3aed", brands: ["PlayStation", "Xbox", "Logitech", "Razer"], subs: ["gaming-pc", "playstation", "gaming-keyboard", "gaming-headsets"], names: ["Arena Gaming PC", "Console Pro Bundle", "Pulse Controller", "Strike Keyboard TKL", "Viper Mouse Wireless", "Surround Headset 7.1", "Stream Capture 4K", "Racer Chair Elite"] },
    appliances: { icon: "❄️", color: "#0891b2", brands: ["Bosch", "Samsung", "LG", "Philips"], subs: ["refrigerators", "washing-machines", "air-conditioners", "coffee-machines"], names: ["FreshLine Refrigerator", "EcoWash 9 kg", "Comfort Air 12K", "Barista Coffee Pro", "QuickHeat Microwave", "PureAir 300", "Silent Dishwasher", "PowerBlend 1200"] },
    home: { icon: "🏠", color: "#059669", brands: ["IKEA", "Tefal", "Luminarc"], subs: ["sofas", "lighting", "cookware"], names: ["Nordic Sofa", "Aura Floor Lamp", "Comfort Chair", "Smart Storage Set", "Everyday Cookware", "Soft Carpet 160", "Dining Set Modern", "Blackout Curtains"] },
    auto: { icon: "🚗", color: "#ea580c", brands: ["Bosch", "Michelin", "Castrol"], subs: ["car-electronics", "phone-holders", "cleaning-products"], names: ["DriveCam Full HD", "Magnetic Phone Mount", "Road Compressor", "Premium Floor Mats", "Car Care Kit", "Engine Oil 5W-30", "Seat Cover Set", "Jump Starter Pro"] },
    tools: { icon: "🛠️", color: "#475569", brands: ["Bosch", "Makita", "DeWalt"], subs: ["drills", "grinders", "tool-boxes"], names: ["Impact Drill 18V", "Angle Grinder Pro", "Precision Driver Set", "Circular Saw 1200", "Workshop Tool Box", "Laser Measure 50m", "Wrench Set 24", "Compact Workbench"] },
    garden: { icon: "🌿", color: "#16a34a", brands: ["Gardena", "Fiskars", "Weber"], subs: ["shovels", "camping", "bbq"], names: ["Garden Tool Set", "Camping Tent 4", "BBQ Grill Compact", "Pruning Shears Pro", "Outdoor Chair Duo", "Watering Kit", "Greenhouse Mini", "Pool Family 3m"] },
    fashion: { icon: "👕", color: "#db2777", brands: ["Adidas", "Nike", "Puma"], subs: ["t-shirts", "jeans", "dresses"], names: ["Essential T-Shirt", "Classic Denim Jeans", "Urban Jacket", "Summer Dress", "Active Sportswear Set", "Leather Belt", "Daily Backpack", "Minimal Watch"] },
    beauty: { icon: "💄", color: "#e11d48", brands: ["L’Oréal", "Nivea", "Philips"], subs: ["cosmetics", "perfumes", "skin-care"], names: ["Hydra Skin Cream", "Signature Eau de Parfum", "Daily Care Set", "Pro Hair Dryer", "Smooth Shaver", "Vitamin Complex", "Massage Device", "Makeup Palette"] },
    food: { icon: "🍷", color: "#b45309", brands: ["Lavazza", "Jacobs", "Barilla"], subs: ["coffee-beans", "tea", "snacks"], names: ["Crema Coffee Beans", "Classic Black Tea", "Italian Pasta Set", "Snack Collection", "Natural Juice Pack", "Dark Chocolate Box", "Aromatic Spices", "Coffee Capsules 30"] },
    energy: { icon: "⚡", color: "#ca8a04", brands: ["EcoFlow", "Bluetti", "Victron"], subs: ["solar-panels", "power-stations", "lithium-batteries"], names: ["River Power Station", "Solar Panel 200W", "Home UPS 1500", "Lithium Battery 100Ah", "Solar Controller MPPT", "Portable Generator", "Smart Charger 20A", "Energy Cable Kit"] }
  };

  const featuredCounts = { computers: 8, electronics: 8, gaming: 8, appliances: 8 };
  const badges = ["Bestseller", "New", "Top rated", null, "Hot deal"];
  const sellers = ["TABANJI Direct", "Tech Harbor", "Home Market", "Trusted Partner"];

  function imageData(icon, title, color) {
    const safeTitle = title.replace(/[&<>"']/g, "");
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" fill="' + color + '"/><circle cx="520" cy="80" r="150" fill="white" opacity=".12"/><circle cx="90" cy="420" r="180" fill="white" opacity=".08"/><text x="320" y="220" text-anchor="middle" font-size="112">' + icon + '</text><text x="320" y="310" text-anchor="middle" font-family="Arial" font-size="27" font-weight="700" fill="white">' + safeTitle.slice(0, 30) + '</text><text x="320" y="352" text-anchor="middle" font-family="Arial" font-size="20" fill="white" opacity=".8">TABANJI marketplace</text></svg>';
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  let sequence = 0;
  return Object.entries(seeds).flatMap(([categoryId, seed]) => {
    const count = featuredCounts[categoryId] || 5;
    return seed.names.slice(0, count).map((name, index) => {
      sequence += 1;
      const price = 39 + ((sequence * 137 + index * 41) % 1960);
      const hasDiscount = sequence % 3 === 0;
      const stockCount = sequence % 11 === 0 ? 0 : 3 + ((sequence * 7) % 38);
      const brand = seed.brands[index % seed.brands.length];
      return {
        id: "tb-" + String(sequence).padStart(4, "0"),
        title: brand + " " + name,
        categoryId,
        subcategorySlug: seed.subs[index % seed.subs.length],
        brand,
        price,
        oldPrice: hasDiscount ? Math.round(price * (1.14 + (index % 3) * 0.06)) : null,
        currency: "USD",
        rating: Number((3.7 + ((sequence * 13) % 13) / 10).toFixed(1)),
        reviewCount: 8 + ((sequence * 29) % 640),
        inStock: stockCount > 0,
        stockCount,
        image: imageData(seed.icon, name, seed.color),
        badge: badges[sequence % badges.length],
        shortDescription: "Reliable " + name.toLowerCase() + " selected for quality, everyday value and convenient delivery.",
        specifications: { Model: "T" + (2020 + sequence), Warranty: (12 + (index % 3) * 12) + " months", Color: ["Graphite", "Blue", "Silver", "White"][index % 4] },
        createdAt: new Date(Date.UTC(2026, 6 - (sequence % 6), 1 + (sequence % 27))).toISOString(),
        popularity: 1000 - sequence * 7 + (index % 4) * 31,
        deliveryText: stockCount ? "Ships in 1–2 business days" : "Notify when available",
        seller: sellers[index % sellers.length],
        sku: "TAB-" + categoryId.slice(0, 3).toUpperCase() + "-" + String(sequence).padStart(5, "0")
      };
    });
  });
})();
