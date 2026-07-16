const categories = [
  {
    id: "computers",
    title: "Laptops & Computers",
    icon: "💻",
    description: "Computers, components and accessories for work, study and play.",
    groups: [
      { title: "Computers", items: ["Laptops", "Gaming Laptops", "Ultrabooks", "Desktop PC", "Mini PC", "Workstations"] },
      { title: "Components", items: ["Processors", "Video Cards", "RAM Memory", "Motherboards", "SSD Drives", "HDD Drives"] },
      { title: "Accessories", items: ["Keyboards", "Mouses", "Webcams", "Headsets", "Microphones"] }
    ],
    brands: ["Apple", "ASUS", "Lenovo", "HP", "Acer"],
    featured: ["Gaming setups", "Work from home", "Student laptops"],
    banner: { eyebrow: "Editor’s choice", title: "Build your ideal workspace", text: "Smart picks for focused work and study.", accent: "#2563eb" },
    popular: true,
    offer: "Save on selected laptops"
  },
  {
    id: "electronics",
    title: "Smartphones & Electronics",
    icon: "📱",
    description: "Phones, entertainment and connected devices for modern life.",
    groups: [
      { title: "Smartphones", items: ["iPhone", "Android Phones", "Samsung", "Phone Cases", "Chargers", "Power Banks"] },
      { title: "TV & Audio", items: ["Smart TV", "LED TV", "Projectors", "Speakers", "Headphones"] },
      { title: "Smart Devices", items: ["Smart Watches", "Smart Home", "Security Cameras"] }
    ],
    brands: ["Samsung", "Apple", "Xiaomi", "Sony", "JBL"],
    featured: ["Latest smartphones", "Smart home essentials", "Portable audio"],
    banner: { eyebrow: "New technology", title: "Stay connected everywhere", text: "Devices designed around your day.", accent: "#0ea5e9" },
    popular: true,
    offer: "Bundle deals on smart devices"
  },
  {
    id: "gaming",
    title: "Gaming",
    icon: "🎮",
    description: "Consoles, gaming machines and gear for every kind of player.",
    groups: [
      { title: "Gaming Devices", items: ["Gaming PC", "Gaming Laptop", "PlayStation", "Xbox", "Nintendo"] },
      { title: "Gaming Accessories", items: ["Gaming Keyboard", "Gaming Mouse", "Gaming Headsets", "Gaming Chairs", "Mouse Pads"] },
      { title: "Streaming", items: ["Webcams", "Microphones", "Capture Cards"] }
    ],
    brands: ["PlayStation", "Xbox", "Nintendo", "Logitech", "Razer"],
    featured: ["Console gaming", "PC gaming", "Streaming gear"],
    banner: { eyebrow: "Level up", title: "Gear built for better play", text: "Responsive accessories and powerful systems.", accent: "#7c3aed" },
    popular: true,
    offer: "Gaming accessories from 15% off"
  },
  {
    id: "appliances",
    title: "Home Appliances",
    icon: "❄️",
    description: "Reliable appliances that make everyday routines simpler.",
    groups: [
      { title: "Large Appliances", items: ["Refrigerators", "Washing Machines", "Dryers", "Dishwashers", "Freezers"] },
      { title: "Climate", items: ["Air Conditioners", "Fans", "Heaters", "Air Purifiers"] },
      { title: "Kitchen Appliances", items: ["Coffee Machines", "Microwaves", "Blenders", "Kettles"] }
    ],
    brands: ["Bosch", "Samsung", "LG", "Philips", "Whirlpool"],
    featured: ["Energy efficient", "Kitchen upgrades", "Clean air"],
    banner: { eyebrow: "Home upgrade", title: "Comfort made effortless", text: "Efficient appliances for every room.", accent: "#0891b2" },
    popular: true,
    offer: "Home appliance weekend prices"
  },
  {
    id: "home",
    title: "Home & Living",
    icon: "🏠",
    description: "Furniture, décor and practical details for a comfortable home.",
    groups: [
      { title: "Furniture", items: ["Sofas", "Beds", "Tables", "Chairs", "Wardrobes"] },
      { title: "Home Decor", items: ["Lighting", "Mirrors", "Pictures", "Carpets", "Curtains"] },
      { title: "Kitchen", items: ["Cookware", "Dishes", "Storage", "Kitchen Tools"] }
    ],
    brands: ["IKEA", "Tefal", "Luminarc", "Kärcher", "Leifheit"],
    featured: ["Small-space living", "Kitchen organization", "Cozy lighting"],
    banner: { eyebrow: "Fresh ideas", title: "Make your space feel yours", text: "Simple updates with a noticeable impact.", accent: "#059669" },
    popular: true,
    offer: "Selected home essentials on sale"
  },
  {
    id: "auto",
    title: "Auto & Moto",
    icon: "🚗",
    description: "Accessories, maintenance products and equipment for the road.",
    groups: [
      { title: "Car Accessories", items: ["Car Electronics", "Phone Holders", "Seat Covers", "Floor Mats"] },
      { title: "Car Care", items: ["Cleaning Products", "Polishes", "Oils", "Fluids"] },
      { title: "Moto", items: ["Helmets", "Motorcycle Gear", "Moto Parts"] }
    ],
    brands: ["Bosch", "Michelin", "Castrol", "Kärcher", "Baseus"],
    featured: ["Road trip ready", "Car care", "Driver electronics"],
    banner: { eyebrow: "For the road", title: "Drive prepared", text: "Practical gear for daily trips and long journeys.", accent: "#ea580c" },
    popular: false,
    offer: "Car care kits at special prices"
  },
  {
    id: "tools",
    title: "Tools & Equipment",
    icon: "🛠️",
    description: "Dependable tools for repairs, workshops and ambitious projects.",
    groups: [
      { title: "Power Tools", items: ["Drills", "Grinders", "Saws", "Screwdrivers"] },
      { title: "Hand Tools", items: ["Wrenches", "Hammers", "Pliers", "Measuring Tools"] },
      { title: "Workshop", items: ["Tool Boxes", "Workbenches", "Storage Systems"] }
    ],
    brands: ["Bosch", "Makita", "DeWalt", "Stanley", "Metabo"],
    featured: ["Workshop essentials", "DIY projects", "Professional tools"],
    banner: { eyebrow: "Ready to build", title: "The right tool for the job", text: "Reliable equipment for precise results.", accent: "#475569" },
    popular: true,
    offer: "Power tool bundles available"
  },
  {
    id: "garden",
    title: "Garden & Outdoors",
    icon: "🌿",
    description: "Everything for growing, relaxing and spending time outdoors.",
    groups: [
      { title: "Garden Tools", items: ["Shovels", "Rakes", "Pruning Tools"] },
      { title: "Outdoor", items: ["Camping", "BBQ", "Pools", "Garden Furniture"] },
      { title: "Growing", items: ["Seeds", "Fertilizers", "Greenhouses"] }
    ],
    brands: ["Gardena", "Fiskars", "Kärcher", "Coleman", "Weber"],
    featured: ["Garden season", "Outdoor cooking", "Camping picks"],
    banner: { eyebrow: "Outside awaits", title: "More time in the fresh air", text: "Garden and leisure essentials in one place.", accent: "#16a34a" },
    popular: false,
    offer: "Outdoor season offers"
  },
  {
    id: "fashion",
    title: "Clothing & Accessories",
    icon: "👕",
    description: "Everyday clothing and accessories for a confident personal style.",
    groups: [
      { title: "Men", items: ["T-Shirts", "Jeans", "Jackets", "Suits"] },
      { title: "Women", items: ["Dresses", "Blouses", "Lingerie", "Sportswear"] },
      { title: "Accessories", items: ["Bags", "Watches", "Jewelry", "Belts"] }
    ],
    brands: ["Adidas", "Nike", "Puma", "Levi’s", "New Balance"],
    featured: ["Everyday basics", "Active style", "New accessories"],
    banner: { eyebrow: "New season", title: "Style for every day", text: "Versatile pieces made to mix and match.", accent: "#db2777" },
    popular: true,
    offer: "Seasonal clothing up to 30% off"
  },
  {
    id: "beauty",
    title: "Health & Beauty",
    icon: "💄",
    description: "Beauty, wellness and personal care for daily routines.",
    groups: [
      { title: "Beauty", items: ["Cosmetics", "Perfumes", "Makeup", "Skin Care"] },
      { title: "Personal Care", items: ["Hair Care", "Shavers", "Body Care"] },
      { title: "Health", items: ["Vitamins", "Massage", "Fitness Products"] }
    ],
    brands: ["L’Oréal", "Nivea", "Philips", "Braun", "Maybelline"],
    featured: ["Skin care", "Personal wellness", "Fragrance"],
    banner: { eyebrow: "Self care", title: "Feel good every day", text: "Thoughtful products for your routine.", accent: "#e11d48" },
    popular: false,
    offer: "Beauty favorites at lower prices"
  },
  {
    id: "food",
    title: "Food & Beverages",
    icon: "🍷",
    description: "Drinks, pantry favorites and treats for the whole household.",
    groups: [
      { title: "Coffee & Tea", items: ["Coffee Beans", "Tea", "Capsules", "Accessories"] },
      { title: "Food", items: ["Snacks", "Sweets", "Pasta", "Spices"] },
      { title: "Drinks", items: ["Juices", "Water", "Soft Drinks"] }
    ],
    brands: ["Lavazza", "Jacobs", "Nestlé", "Ahmad Tea", "Barilla"],
    featured: ["Coffee corner", "Pantry staples", "Sweet treats"],
    banner: { eyebrow: "Pantry picks", title: "Favorites for every table", text: "Stock up on everyday essentials.", accent: "#b45309" },
    popular: false,
    offer: "Multi-buy pantry savings"
  },
  {
    id: "energy",
    title: "Energy Solutions",
    icon: "⚡",
    description: "Independent power, storage and solar solutions for home and work.",
    groups: [
      { title: "Solar Energy", items: ["Solar Panels", "Controllers", "Cables"] },
      { title: "Power", items: ["Generators", "Power Stations", "UPS"] },
      { title: "Storage", items: ["Lithium Batteries", "AGM Batteries", "Chargers"] }
    ],
    brands: ["EcoFlow", "Bluetti", "Jackery", "Victron", "Must"],
    featured: ["Backup power", "Solar kits", "Portable stations"],
    banner: { eyebrow: "Power anywhere", title: "Energy when you need it", text: "Flexible solutions for home and travel.", accent: "#ca8a04" },
    popular: true,
    offer: "Special prices on power stations"
  }
];
