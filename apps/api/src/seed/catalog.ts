export enum Unit {
  KG = "KG",
  GM = "GM",
  LTR = "LTR",
  ML = "ML",
  PC = "PC",
}

export function getCategory(name: string) {
  const n = name.toLowerCase();

  if (n.includes("ice cream") || n.includes("cone")) return "ICE_CREAM";
  if (n.includes("juice") || n.includes("cola") || n.includes("drink") || n.includes("lassi")) return "DRINKS";
  if (n.includes("pickle") || n.includes("paste")) return "GROCERY";
  if (n.includes("kaju") || n.includes("badam") || n.includes("pista")) return "DRY_FRUITS";
  if (n.includes("biscuit") || n.includes("cookies")) return "BAKERY";
  if (n.includes("sev") || n.includes("mixture") || n.includes("namkeen")) return "NAMKEEN";
  if (n.includes("candy") || n.includes("chocolate")) return "CANDY";
  if (n.includes("kachori") || n.includes("samosa") || n.includes("chaat")) return "FAST_FOOD";

  return "SWEETS";
}

export function extractVariant(name: string) {
  const match = name.match(/(\d+\s?(g|kg|ml|l))/i);
  return match ? match[0] : "Regular";
}

export function cleanName(name: string) {
  return name.replace(/(\d+\s?(g|kg|ml|l))/gi, "").trim();
}
const products = [
    {
      name: "Fika mathri",
      price: 280,
      hsnCode: "2106",
      unit: Unit.KG,
    },
    {
      name: "Mitha mathri",
      price: 240,
      hsnCode: "2106",
      unit: Unit.KG,
    },
    {
      name: "Khatta meetha",
      price: 55,
      hsnCode: "2106",
      unit: Unit.KG,
    },
    {
      name: "Maaza",
      price: 40,
      hsnCode: "2201",
      unit: Unit.PC,
    },
    {
      name: "Dry fruit laddu",
      price: 1600,
      hsnCode: "2106",
      unit: Unit.KG,
    },
    {
      name: "Gud chana",
      price: 80,
      hsnCode: "2106",
      unit: Unit.KG,
    },
    {
      name: "Real juice apple 1lt",
      price: 108,
      hsnCode: "2201",
      unit: Unit.PC,
    },
    {
      name: "Real grapes juice 1lt",
      price: 130,
      hsnCode: "2201",
      unit: Unit.PC,
    },
    {
      name: "Futa chana 200g",
      price: 40,
      hsnCode: "2106",
      unit: Unit.PC,
    },
    {
      name: "Aam papad roll 250g",
      price: 290,
      hsnCode: "2106",
      unit: Unit.PC,
    },
  ];

  const productsBatch2 = [
    { name: "Cheese Licks 150g", price: 40, hsnCode: "2106", unit: Unit.PC },
    { name: "Top Butter Much (Bisk Farm) 200g", price: 30, hsnCode: "2106", unit: Unit.PC },
    { name: "Nice (Bisk Farm)", price: 25, hsnCode: "2106", unit: Unit.PC },
    { name: "Chatpata Spicy (Bisk Farm) 200g", price: 40, hsnCode: "2106", unit: Unit.PC },
    { name: "Googly (Bisk Farm) 180g", price: 20, hsnCode: "2106", unit: Unit.PC },
    { name: "Top Herbs (Bisk Farm) 200g", price: 40, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Chana Jor Salted 200g", price: 70, hsnCode: "2106", unit: Unit.PC },
    { name: "Sabudana Chips 125g", price: 100, hsnCode: "2106", unit: Unit.PC },
    { name: "Royal Kreme 150g", price: 35, hsnCode: "2106", unit: Unit.PC },
    { name: "Licks Orange (Bisk Farm) 150g", price: 35, hsnCode: "2106", unit: Unit.PC },
    { name: "Jeera Wonder (Bisk Farm) 194g", price: 30, hsnCode: "2106", unit: Unit.PC },
    { name: "Coco Malai 200g", price: 30, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Pista Badam Biscuit 250g", price: 130, hsnCode: "2106", unit: Unit.PC },
    { name: "Nankhatai Cookies 250g", price: 110, hsnCode: "2106", unit: Unit.PC },
    { name: "Atta Namkeen", price: 110, hsnCode: "2106", unit: Unit.KG },
    { name: "Honey Oats Cookies 250g", price: 155, hsnCode: "2106", unit: Unit.PC },
    { name: "Multi Grain Cookies 250g", price: 150, hsnCode: "2106", unit: Unit.PC },
  
    
    { name: "Maaza 125ml", price: 10, hsnCode: "2202", unit: Unit.PC },
    { name: "Pulpy Orange", price: 20, hsnCode: "2202", unit: Unit.PC },
    { name: "Fanta 2L", price: 100, hsnCode: "2202", unit: Unit.PC },
    { name: "Real Grape Juice 1L", price: 130, hsnCode: "2202", unit: Unit.PC },
  
    
    { name: "Vadilal Chocolate Chips Ice Cream 700ml", price: 300, hsnCode: "2105", unit: Unit.PC },
    { name: "Vadilal Butterscotch Brick 750ml", price: 280, hsnCode: "2105", unit: Unit.PC },
    { name: "Vadilal American Nuts", price: 350, hsnCode: "2105", unit: Unit.PC },
  
  
    { name: "Jalebi", price: 240, hsnCode: "2106", unit: Unit.KG },
    { name: "Chabeni Mixture 400g", price: 120, hsnCode: "2106", unit: Unit.PC },
    { name: "Khatta Mitha Mixture 400g", price: 120, hsnCode: "2106", unit: Unit.PC },
    { name: "Chabeni Mixture 200g", price: 60, hsnCode: "2106", unit: Unit.PC },
    { name: "Khatta Mitha Mixture 200g", price: 60, hsnCode: "2106", unit: Unit.PC },
  
    { name: "White Chocolate Kaju", price: 800, hsnCode: "2106", unit: Unit.KG },
    { name: "Masala Sev", price: 300, hsnCode: "2106", unit: Unit.KG },
    { name: "Chhappan Bhog", price: 850, hsnCode: "2106", unit: Unit.KG },
    { name: "Amla Murabba", price: 220, hsnCode: "2106", unit: Unit.KG },
    { name: "Mango Katli", price: 130, hsnCode: "2106", unit: Unit.KG },
    { name: "Dry Samosa 250g", price: 60, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Rabri", price: 60, hsnCode: "2106", unit: Unit.PC },
    { name: "Soan Papdi 400g", price: 135, hsnCode: "2106", unit: Unit.PC },
    { name: "Aloo Gunda", price: 20, hsnCode: "2106", unit: Unit.PC },
    { name: "Sev", price: 300, hsnCode: "2106", unit: Unit.KG },
    { name: "Sitabhog", price: 480, hsnCode: "2106", unit: Unit.KG },
    { name: "Malpua", price: 440, hsnCode: "2106", unit: Unit.KG },
  
    { name: "Akhrot 250g", price: 550, hsnCode: "1904", unit: Unit.PC },
    { name: "Kismis 250g", price: 160, hsnCode: "1904", unit: Unit.PC },
    { name: "Black Kismis 250g", price: 260, hsnCode: "1904", unit: Unit.PC },
    { name: "Khajur (Lulu) 400g", price: 400, hsnCode: "1904", unit: Unit.PC },
    { name: "Khajur (Safawi) 500g", price: 450, hsnCode: "1904", unit: Unit.PC },
    { name: "Anjir 250g", price: 380, hsnCode: "1904", unit: Unit.PC },
  
    { name: "Mini Cone", price: 10, hsnCode: "2105", unit: Unit.PC },
    { name: "Cookie Disc Flingo Cone", price: 10, hsnCode: "2105", unit: Unit.PC },
    { name: "Nutty Butterscotch Flingo Cone", price: 35, hsnCode: "2105", unit: Unit.PC },
    { name: "Choco Brownie Flingo Cone", price: 40, hsnCode: "2105", unit: Unit.PC },
    { name: "American Nuts Flingo Cone", price: 50, hsnCode: "2105", unit: Unit.PC },
  
    { name: "Gajar Halwa", price: 600, hsnCode: "2106", unit: Unit.KG },
    { name: "Til Laddu", price: 400, hsnCode: "2106", unit: Unit.KG },
    { name: "Chaat Plate", price: 35, hsnCode: "996331", unit: Unit.PC },
    { name: "Patisa", price: 640, hsnCode: "2106", unit: Unit.KG },
    { name: "Haldiram Mixture", price: 82, hsnCode: "2106", unit: Unit.PC },
    { name: "Badam", price: 1200, hsnCode: "1904", unit: Unit.KG },
  ];

  const productsBatch3 = [
    { name: "Malai Chamcham (Gur)", price: 680, hsnCode: "2106", unit: Unit.KG },
    { name: "Kalakand (Gur)", price: 680, hsnCode: "2106", unit: Unit.KG },
    { name: "Rasgulla (Gur)", price: 20, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Kachori Chaat (Full Plate)", price: 30, hsnCode: "996331", unit: Unit.PC },
    { name: "Dhokla Chaat (Full Plate)", price: 30, hsnCode: "996331", unit: Unit.PC },
    { name: "Samosa (Half Plate)", price: 20, hsnCode: "996331", unit: Unit.PC },
  
    { name: "Punjabi Masala Papad (Agrawal)", price: 95, hsnCode: "2106", unit: Unit.PC },
    { name: "Khatta Mitha Chana Papad", price: 80, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Honey Muesli 250g", price: 180, hsnCode: "2106", unit: Unit.PC },
    { name: "Protein Bites 250g", price: 170, hsnCode: "2106", unit: Unit.PC },
    { name: "Salted Muesli 250g", price: 170, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Faluda Mix Rose 200g", price: 90, hsnCode: "2106", unit: Unit.PC },
    { name: "Lal Mirch Lasun Paste 500g", price: 175, hsnCode: "2106", unit: Unit.PC },
    { name: "Lal Mirch Lasun Paste 100g", price: 46, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Lemon Pickle (Nilon's) 400g", price: 160, hsnCode: "2106", unit: Unit.PC },
    { name: "Red Chilli Pickle (Nilon's) 400g", price: 187, hsnCode: "2106", unit: Unit.PC },
    { name: "Garlic Pickle (Nilon's) 400g", price: 235, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Pepsi 400ml", price: 20, hsnCode: "2202", unit: Unit.PC },
    { name: "Pepsi 750ml", price: 40, hsnCode: "2202", unit: Unit.PC },
    { name: "Pepsi 2.25L", price: 100, hsnCode: "2202", unit: Unit.PC },
  
    { name: "7UP 250ml", price: 20, hsnCode: "2202", unit: Unit.PC },
    { name: "7UP 750ml", price: 40, hsnCode: "2202", unit: Unit.PC },
    { name: "7UP 2.25L", price: 90, hsnCode: "2202", unit: Unit.PC },
  
    { name: "Coffee Milkshake 200ml", price: 30, hsnCode: "2202", unit: Unit.PC },
  
    { name: "Mini Butter Cookies", price: 180, hsnCode: "2106", unit: Unit.PC },
    { name: "Karachi Fruit Biscuit 400g", price: 220, hsnCode: "1905", unit: Unit.PC },
    { name: "Mathari", price: 60, hsnCode: "1905", unit: Unit.PC },
  
    { name: "Kaju Cookies 250g", price: 130, hsnCode: "2106", unit: Unit.PC },
    { name: "Cake Rusk 250g", price: 105, hsnCode: "2106", unit: Unit.PC },
    { name: "Elaichi Toast (Haldiram) 250g", price: 40, hsnCode: "2106", unit: Unit.PC },
    { name: "Milk Toast (Haldiram) 250g", price: 40, hsnCode: "2106", unit: Unit.PC },
    { name: "Pape Toast 400g", price: 85, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Dry Fruit Khazana Cup", price: 50, hsnCode: "2105", unit: Unit.PC },
    { name: "Rajwadi Kulfi Candy", price: 50, hsnCode: "2105", unit: Unit.PC },
    { name: "Butterscotch Jumbo Cup", price: 30, hsnCode: "2105", unit: Unit.PC },
    { name: "American Nuts Jumbo Cup", price: 35, hsnCode: "2105", unit: Unit.PC },
    { name: "Slice Cassata", price: 60, hsnCode: "2105", unit: Unit.PC },
    { name: "Vanilla Ice Cream", price: 115, hsnCode: "2105", unit: Unit.PC },
  
    { name: "Hing Peda (Shadani) 120g", price: 95, hsnCode: "2106", unit: Unit.PC },
    { name: "Paan Candy (Shadani) 135g", price: 85, hsnCode: "2106", unit: Unit.PC },
    { name: "Sweet Amla (Shadani) 110g", price: 95, hsnCode: "2106", unit: Unit.PC },
    { name: "Sahi Mix Saunf (Shadani) 100g", price: 90, hsnCode: "2106", unit: Unit.PC },
    { name: "Chatpata Amla (Shadani) 120g", price: 95, hsnCode: "2106", unit: Unit.PC },
    { name: "Murra 150g", price: 30, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Jhalmuri (Bikaji) 150g", price: 40, hsnCode: "2106", unit: Unit.PC },
    { name: "Tasty Nuts (Haldiram) 200g", price: 55, hsnCode: "2106", unit: Unit.PC },
    { name: "Dry Fruits Mix", price: 340, hsnCode: "2106", unit: Unit.KG },
    { name: "Navratan Mix (Haldiram) 200g", price: 57, hsnCode: "2106", unit: Unit.PC },
    { name: "Nimboo Pudina Chana (Jobsons) 150g", price: 70, hsnCode: "2106", unit: Unit.PC },
    { name: "Roasted Peanuts (Jobsons) 140g", price: 75, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Kaju Katli", price: 1000, hsnCode: "2106", unit: Unit.KG },
    { name: "Sada Mixture 400g", price: 120, hsnCode: "2106", unit: Unit.PC },
    { name: "Kaju Roll", price: 1080, hsnCode: "2106", unit: Unit.KG },
    { name: "Pista Almond Sweet", price: 1480, hsnCode: "2106", unit: Unit.KG },
    { name: "Lasun Sev 200g", price: 60, hsnCode: "2106", unit: Unit.PC },
    { name: "Mota Sev 200g", price: 60, hsnCode: "2106", unit: Unit.PC },
  ];
  const productsBatch4 = [
    { name: "Real Apple Juice 1L", price: 108, hsnCode: "2202", unit: Unit.PC },
    { name: "Real Litchi Juice", price: 117, hsnCode: "2202", unit: Unit.PC },
    { name: "Real Mixed Fruit Juice", price: 122, hsnCode: "2202", unit: Unit.PC },
    { name: "Real Guava Juice", price: 112, hsnCode: "2202", unit: Unit.PC },
  
    { name: "Tropicana Mixed Fruit Juice 1L", price: 80, hsnCode: "2202", unit: Unit.PC },
  
    { name: "Kurkure Masala Munch 100g", price: 20, hsnCode: "210690", unit: Unit.PC },
    { name: "Kurkure Chilli Chatka 98g", price: 20, hsnCode: "210690", unit: Unit.PC },
    { name: "Lays Cream & Onion 59g", price: 20, hsnCode: "210690", unit: Unit.PC },
    { name: "Lays Spanish Tomato Tango 59g", price: 20, hsnCode: "210690", unit: Unit.PC },
  
    { name: "Mirinda 2.25L", price: 100, hsnCode: "2202", unit: Unit.PC },
    { name: "Nimbooz 345ml", price: 20, hsnCode: "2202", unit: Unit.PC },
    { name: "Red Bull 250ml", price: 125, hsnCode: "2202", unit: Unit.PC },
    { name: "Hell Energy Drink 250ml", price: 60, hsnCode: "2202", unit: Unit.PC },
    { name: "Coconut Water 180ml", price: 40, hsnCode: "2202", unit: Unit.PC },
  
    { name: "Bisleri 2L", price: 30, hsnCode: "2201", unit: Unit.PC },
    { name: "Bisleri 1L", price: 20, hsnCode: "2201", unit: Unit.PC },
  
    { name: "Misti Dahi (Small)", price: 30, hsnCode: "2106", unit: Unit.PC },
    { name: "Misti Dahi (Big)", price: 60, hsnCode: "2106", unit: Unit.PC },
    { name: "Rasmalai (Cup)", price: 60, hsnCode: "2106", unit: Unit.PC },
    { name: "Rajbhog", price: 35, hsnCode: "2106", unit: Unit.PC },
    { name: "Rasgulla", price: 16, hsnCode: "2106", unit: Unit.PC },
    { name: "Kacha Golla (Gur)", price: 680, hsnCode: "2106", unit: Unit.KG },
  
    { name: "Sugar Free Sweet", price: 640, hsnCode: "2106", unit: Unit.KG },
    { name: "Bundi (Ghee)", price: 440, hsnCode: "2106", unit: Unit.KG },
    { name: "Pinni Laddu", price: 640, hsnCode: "2106", unit: Unit.KG },
    { name: "Gond Laddu", price: 640, hsnCode: "2106", unit: Unit.KG },
  
    { name: "Sandesh", price: 640, hsnCode: "2106", unit: Unit.KG },
    { name: "Sandesh (Gur)", price: 680, hsnCode: "2106", unit: Unit.KG },
  
    { name: "Peda", price: 480, hsnCode: "2106", unit: Unit.KG },
    { name: "Nariyal Barfi", price: 480, hsnCode: "2106", unit: Unit.KG },
    { name: "Nariyal Peda", price: 480, hsnCode: "2106", unit: Unit.KG },
  
    { name: "Gujiya", price: 480, hsnCode: "2106", unit: Unit.KG },
    { name: "Dry Gujiya", price: 680, hsnCode: "2106", unit: Unit.KG },
  
    { name: "Gulab Jamun", price: 380, hsnCode: "2106", unit: Unit.KG },
    { name: "Kala Jamun", price: 480, hsnCode: "2106", unit: Unit.KG },
  
    { name: "Roasted Badam", price: 320, hsnCode: "1904", unit: Unit.KG },
    { name: "Mix Nuts", price: 340, hsnCode: "1904", unit: Unit.KG },
  
    { name: "Khajur (Sharbat) 250g", price: 150, hsnCode: "1904", unit: Unit.PC },
    { name: "Roasted Pista 250g", price: 400, hsnCode: "1904", unit: Unit.PC },
    { name: "Roasted Kaju 250g", price: 320, hsnCode: "1904", unit: Unit.PC },
    { name: "Roasted Kaju 100g", price: 140, hsnCode: "1904", unit: Unit.PC },
    { name: "Sada Kaju 250g", price: 350, hsnCode: "1904", unit: Unit.PC },
  
    { name: "Chocolate Chips Ice Cream", price: 150, hsnCode: "2105", unit: Unit.PC },
    { name: "Pista Cone", price: 25, hsnCode: "2105", unit: Unit.PC },
    { name: "Butterscotch Cone", price: 30, hsnCode: "2105", unit: Unit.PC },
  
    { name: "Amul Fresh Cream", price: 70, hsnCode: "0401", unit: Unit.PC },
  
    { name: "Mini Bakharwadi 180g", price: 50, hsnCode: "2106", unit: Unit.PC },
    { name: "Mango Delight 500g", price: 200, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Mathri 200g", price: 62, hsnCode: "2106", unit: Unit.PC },
    { name: "Jeera Mathri 200g", price: 62, hsnCode: "2106", unit: Unit.PC },
    { name: "Methi Mathri 200g", price: 62, hsnCode: "2106", unit: Unit.PC },
    { name: "Lasun Mathri 200g", price: 62, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Bhujia Sev (Haldiram) 1kg", price: 275, hsnCode: "2106", unit: Unit.KG },
    { name: "Bhujia Sev (Haldiram) 600g", price: 165, hsnCode: "2106", unit: Unit.PC },
    { name: "Bhujia Sev (Haldiram) 200g", price: 57, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Chana Chur (Bikaji) 400g", price: 122, hsnCode: "2106", unit: Unit.PC },
    { name: "All in One Namkeen (Haldiram) 400g", price: 115, hsnCode: "2106", unit: Unit.PC },
    { name: "All in One Namkeen (Haldiram) 200g", price: 57, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Samosa", price: 15, hsnCode: "996331", unit: Unit.PC },
  ];
  const productsBatch5 = [
    { name: "Crunchy Butterscotch Ice Cream Tub", price: 115, hsnCode: "2105", unit: Unit.PC },
    { name: "Dark Chocolate Ice Cream Tub", price: 175, hsnCode: "2105", unit: Unit.PC },
    { name: "Belgian Chocolate Ice Cream Tub", price: 155, hsnCode: "2105", unit: Unit.PC },
    { name: "Kesar Rasmalai Ice Cream Tub", price: 170, hsnCode: "2105", unit: Unit.PC },
    { name: "Classic Malai Ice Cream Tub", price: 160, hsnCode: "2105", unit: Unit.PC },
    { name: "Falooda Ice Cream Tub", price: 150, hsnCode: "2105", unit: Unit.PC },
  
    { name: "Real Cranberry Juice 1L", price: 132, hsnCode: "2202", unit: Unit.PC },
    { name: "Real Pomegranate Juice 1L", price: 122, hsnCode: "2202", unit: Unit.PC },
    { name: "Real Pineapple Juice 1L", price: 122, hsnCode: "2202", unit: Unit.PC },
    { name: "Real Mosambi Juice 1L", price: 122, hsnCode: "2202", unit: Unit.PC },
  
    { name: "Khakhra (Kanidha)", price: 80, hsnCode: "2106", unit: Unit.PC },
    { name: "Sada Papad", price: 85, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Milk Cake (Lamba)", price: 600, hsnCode: "2106", unit: Unit.KG },
    { name: "Doda Barfi", price: 600, hsnCode: "2106", unit: Unit.KG },
    { name: "Anjir Roll", price: 1280, hsnCode: "2106", unit: Unit.KG },
    { name: "Milk Cake (Box)", price: 640, hsnCode: "2106", unit: Unit.KG },
    { name: "Kheer Kadam", price: 560, hsnCode: "2106", unit: Unit.KG },
    { name: "Malai Barfi", price: 520, hsnCode: "2106", unit: Unit.KG },
  
    { name: "Sprite 200ml", price: 30, hsnCode: "2202", unit: Unit.PC },
    { name: "Sprite 250ml", price: 20, hsnCode: "2202", unit: Unit.PC },
    { name: "Sprite 750ml", price: 90, hsnCode: "2202", unit: Unit.PC },
    { name: "Sprite 2L", price: 100, hsnCode: "2202", unit: Unit.PC },
  
    { name: "Thums Up 200ml Can", price: 30, hsnCode: "2202", unit: Unit.PC },
    { name: "Thums Up 750ml", price: 90, hsnCode: "2202", unit: Unit.PC },
  
    { name: "Petha (Haldiram) 400g", price: 105, hsnCode: "2106", unit: Unit.PC },
    { name: "Chikki", price: 30, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Red Chilli (DLS)", price: 65, hsnCode: "2106", unit: Unit.PC },
    { name: "Green Chilli (DLS)", price: 60, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Kaju", price: 1400, hsnCode: "1904", unit: Unit.KG },
    { name: "Badam 250g", price: 300, hsnCode: "1904", unit: Unit.PC },
  
    { name: "Gujiya (Piece)", price: 25, hsnCode: "2106", unit: Unit.PC },
    { name: "Khoya", price: 480, hsnCode: "0401", unit: Unit.KG },
  
    { name: "Cutlet Samosa", price: 20, hsnCode: "996331", unit: Unit.PC },
    { name: "Green Peas", price: 120, hsnCode: "2106", unit: Unit.KG },
    { name: "Thepla", price: 30, hsnCode: "996331", unit: Unit.PC },
  
    { name: "Badam Cookies 250g", price: 130, hsnCode: "1905", unit: Unit.PC },
    { name: "Butter Cookies 250g", price: 160, hsnCode: "1905", unit: Unit.PC },
    { name: "Coconut Jaggery Cookies 230g", price: 170, hsnCode: "1905", unit: Unit.PC },
    { name: "Ajwain Cookies", price: 115, hsnCode: "1905", unit: Unit.PC },
  
    { name: "Litchi Drink 125ml", price: 10, hsnCode: "2202", unit: Unit.PC },
    { name: "Cream Bell Coffee 180ml", price: 30, hsnCode: "2202", unit: Unit.PC },
    { name: "Cream Bell Kesar Badam 180ml", price: 20, hsnCode: "2202", unit: Unit.PC },
    { name: "Cream Bell Chocolate 180ml", price: 30, hsnCode: "2202", unit: Unit.PC },
  
    { name: "Mirinda 400ml", price: 20, hsnCode: "2202", unit: Unit.PC },
    { name: "Mirinda 750ml", price: 40, hsnCode: "2202", unit: Unit.PC },
  
    { name: "Coca Cola 1L", price: 50, hsnCode: "2202", unit: Unit.PC },
    { name: "Goli Soda", price: 30, hsnCode: "2201", unit: Unit.PC },
  
    { name: "Bisk Farm Top Crunch Biscuit 148g", price: 40, hsnCode: "1905", unit: Unit.PC },
    { name: "Bisk Farm Googly Bite Biscuit 208g", price: 30, hsnCode: "1905", unit: Unit.PC },
  
    { name: "Mountain Dew 1.25L", price: 50, hsnCode: "2202", unit: Unit.PC },
    { name: "Lite Chiwda 200g", price: 45, hsnCode: "2106", unit: Unit.PC },
    { name: "Haldiram Mixture 50g", price: 10, hsnCode: "210690", unit: Unit.PC },
  
    { name: "Modak", price: 480, hsnCode: "2106", unit: Unit.KG },
    { name: "Besan Modak", price: 480, hsnCode: "2106", unit: Unit.KG },
    { name: "Bundi Modak (Ghee)", price: 560, hsnCode: "2106", unit: Unit.KG },
  
    { name: "Mathri", price: 280, hsnCode: "2106", unit: Unit.KG },
  ];

  const productsBatch6 = [
    { name: "Khasta 250g", price: 50, hsnCode: "2106", unit: Unit.PC },
    { name: "Barik Saloni 250g", price: 50, hsnCode: "2106", unit: Unit.PC },
    { name: "Palak Mathri 250g", price: 60, hsnCode: "2106", unit: Unit.PC },
    { name: "Methi Mathri 250g", price: 60, hsnCode: "2106", unit: Unit.PC },
    { name: "Mathri 250g", price: 50, hsnCode: "2106", unit: Unit.PC },
    { name: "Saloni 250g", price: 50, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Rooh Afza Sharbat 750ml", price: 180, hsnCode: "2202", unit: Unit.PC },
    { name: "Mala's Orange Crush 750ml", price: 180, hsnCode: "2202", unit: Unit.PC },
    { name: "Mala's Banana Crush 750ml", price: 180, hsnCode: "2202", unit: Unit.PC },
    { name: "Mala's Watermelon Syrup 750ml", price: 160, hsnCode: "2202", unit: Unit.PC },
    { name: "Mala's Lime Cordial 750ml", price: 160, hsnCode: "2202", unit: Unit.PC },
    { name: "Real Orange Juice 1L", price: 122, hsnCode: "2202", unit: Unit.PC },
  
    { name: "Kacha Golla", price: 600, hsnCode: "2106", unit: Unit.KG },
    { name: "Nikuti", price: 480, hsnCode: "2106", unit: Unit.KG },
    { name: "Pantua", price: 480, hsnCode: "2106", unit: Unit.KG },
  
    { name: "Paneer", price: 440, hsnCode: "0406", unit: Unit.KG },
    { name: "Curd (Dahi)", price: 140, hsnCode: "0403", unit: Unit.KG },
    { name: "Misti Dahi", price: 350, hsnCode: "2106", unit: Unit.KG },
  
    { name: "Cutlet", price: 20, hsnCode: "996331", unit: Unit.PC },
    { name: "Kesar Lassi (Glass)", price: 40, hsnCode: "2202", unit: Unit.PC },
  
    { name: "KitKat Small", price: 10, hsnCode: "1806", unit: Unit.PC },
    { name: "KitKat Medium", price: 20, hsnCode: "1806", unit: Unit.PC },
  
    { name: "Frozen Green Peas", price: 120, hsnCode: "0710", unit: Unit.KG },
  
    { name: "Butterscotch Ice Cream Cup", price: 140, hsnCode: "2105", unit: Unit.PC },
    { name: "Strawberry Ice Cream Cup", price: 120, hsnCode: "2105", unit: Unit.PC },
    { name: "American Nuts Ice Cream Cup", price: 175, hsnCode: "2105", unit: Unit.PC },
    { name: "Choco Brownie Ice Cream Cup", price: 175, hsnCode: "2105", unit: Unit.PC },
    { name: "Vanilla Brownie Ice Cream Tub", price: 110, hsnCode: "2105", unit: Unit.PC },
    { name: "American Nuts Ice Cream Tub", price: 135, hsnCode: "2105", unit: Unit.PC },
  
    { name: "Amul Masti Lassi", price: 20, hsnCode: "2202", unit: Unit.PC },
    { name: "Heylo Butter Cookies", price: 20, hsnCode: "1905", unit: Unit.PC },
  
    { name: "Paper Plate Small", price: 70, hsnCode: "4823", unit: Unit.PC },
    { name: "Paper Plate Large", price: 80, hsnCode: "4823", unit: Unit.PC },
    { name: "Paper Glass", price: 100, hsnCode: "4823", unit: Unit.PC },
    { name: "Plastic Spoon", price: 100, hsnCode: "3924", unit: Unit.PC },
  
    { name: "Thums Up 2L", price: 100, hsnCode: "2202", unit: Unit.PC },
    { name: "Thums Up 250ml", price: 20, hsnCode: "2202", unit: Unit.PC },
    { name: "Sting Energy Drink", price: 20, hsnCode: "2202", unit: Unit.PC },
    { name: "Limca 250ml", price: 20, hsnCode: "2202", unit: Unit.PC },
    { name: "Kinley Soda 750ml", price: 20, hsnCode: "2201", unit: Unit.PC },
    { name: "Maaza", price: 20, hsnCode: "2202", unit: Unit.PC },
  
    { name: "Mewa Bites", price: 1200, hsnCode: "2106", unit: Unit.KG },
    { name: "Balushahi", price: 360, hsnCode: "2106", unit: Unit.KG },
    { name: "Coca Cola 2L", price: 100, hsnCode: "2202", unit: Unit.PC },
    { name: "Nariyal Barfi", price: 480, hsnCode: "2106", unit: Unit.KG },
    { name: "Sandwich Malai Chap", price: 560, hsnCode: "2106", unit: Unit.KG },
  
    { name: "Bisleri 500ml (Pack)", price: 220, hsnCode: "2201", unit: Unit.PC },
  
    { name: "Khoya Jalebi", price: 440, hsnCode: "2106", unit: Unit.KG },
    { name: "Malai Chap", price: 560, hsnCode: "2106", unit: Unit.KG },
    { name: "Malai Toast", price: 600, hsnCode: "2106", unit: Unit.KG },
    { name: "Malai Chamcham", price: 640, hsnCode: "2106", unit: Unit.KG },
    { name: "Chamcham", price: 520, hsnCode: "2106", unit: Unit.KG },
    { name: "Rasbhari", price: 520, hsnCode: "2106", unit: Unit.KG },
  
    { name: "Green Chilli Pickle 200g", price: 89, hsnCode: "2106", unit: Unit.PC },
    { name: "Mango Pickle 400g", price: 160, hsnCode: "2106", unit: Unit.PC },
    { name: "Lemon Pickle 200g", price: 89, hsnCode: "2106", unit: Unit.PC },
    { name: "Mango Pickle 900g", price: 215, hsnCode: "2106", unit: Unit.PC },
    { name: "Sweet Lemon Pickle 250g", price: 80, hsnCode: "2106", unit: Unit.PC },
    { name: "Tomato Ketchup 1.2kg", price: 225, hsnCode: "2103", unit: Unit.PC },
  ];
  const productsBatch7 = [
    { name: "Salted Peanuts (Haldiram) 200g", price: 55, hsnCode: "2106", unit: Unit.PC },
    { name: "Aloo Bhujia Sev (Haldiram) 200g", price: 55, hsnCode: "2106", unit: Unit.PC },
    { name: "Aloo Bhujia Sev (Haldiram) 400g", price: 95, hsnCode: "2106", unit: Unit.PC },
    { name: "Mixture (Haldiram) 200g", price: 45, hsnCode: "2106", unit: Unit.PC },
    { name: "Mixture (Haldiram) 400g", price: 88, hsnCode: "2106", unit: Unit.PC },
    { name: "Soya Stick (Haldiram) 200g", price: 45, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Bomber Candy", price: 35, hsnCode: "1704", unit: Unit.PC },
    { name: "One Up Chocobar Candy", price: 20, hsnCode: "1704", unit: Unit.PC },
    { name: "Fantastic Candy", price: 40, hsnCode: "1704", unit: Unit.PC },
    { name: "Volcano Chocolate Cone", price: 30, hsnCode: "2105", unit: Unit.PC },
    { name: "Vadilal Treat Cone", price: 20, hsnCode: "2105", unit: Unit.PC },
    { name: "Chocolate Treat Cone", price: 20, hsnCode: "2105", unit: Unit.PC },
  
    { name: "Chana Jor (Jobsons) 160g", price: 60, hsnCode: "2106", unit: Unit.PC },
    { name: "Manchurian Stick (National) 100g", price: 75, hsnCode: "2106", unit: Unit.PC },
    { name: "Soya Sticks (National) 180g", price: 80, hsnCode: "2106", unit: Unit.PC },
    { name: "Sezwan Sticks (National) 180g", price: 75, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Sakkar Para 500g", price: 100, hsnCode: "2106", unit: Unit.PC },
    { name: "Gur Para 250g", price: 60, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Banana Wafers Black Pepper 100g", price: 55, hsnCode: "2106", unit: Unit.PC },
    { name: "Pan Mix Saunf (Shadani)", price: 95, hsnCode: "2106", unit: Unit.PC },
    { name: "Roasted Saunf (Shadani) 120g", price: 95, hsnCode: "2106", unit: Unit.PC },
    { name: "Orange Candy (Shadani) 135g", price: 85, hsnCode: "1704", unit: Unit.PC },
    { name: "Anardana Goli (Shadani) 120g", price: 90, hsnCode: "1704", unit: Unit.PC },
    { name: "Chatpati Imli (Shadani) 80g", price: 90, hsnCode: "1704", unit: Unit.PC },
  
    { name: "Elaichi Barfi", price: 520, hsnCode: "2106", unit: Unit.KG },
    { name: "Besan Barfi", price: 560, hsnCode: "2106", unit: Unit.KG },
    { name: "Chocolate Barfi", price: 560, hsnCode: "2106", unit: Unit.KG },
    { name: "Bundi Laddu (Ghee)", price: 560, hsnCode: "2106", unit: Unit.KG },
    { name: "Bundi Laddu (Dalda)", price: 360, hsnCode: "2106", unit: Unit.KG },
    { name: "Besan Laddu (Ghee)", price: 480, hsnCode: "2106", unit: Unit.KG },
  
    { name: "Mixture (Loose)", price: 43, hsnCode: "2106", unit: Unit.KG },
    { name: "Jaggery (Gur)", price: 320, hsnCode: "1701", unit: Unit.KG },
    { name: "Liquid Jaggery", price: 300, hsnCode: "1702", unit: Unit.KG },
    { name: "Pista Cookies 250g", price: 130, hsnCode: "1905", unit: Unit.PC },
    { name: "Lays Chips", price: 20, hsnCode: "1905", unit: Unit.PC },
    { name: "Thandai (Guruji)", price: 399, hsnCode: "2202", unit: Unit.PC },
  
    { name: "Jaljira (Jalani)", price: 1, hsnCode: "2103", unit: Unit.PC },
  
    { name: "Decha Green 500g", price: 175, hsnCode: "2106", unit: Unit.PC },
    { name: "Decha Red 500g", price: 175, hsnCode: "2106", unit: Unit.PC },
    { name: "Decha Green 100g", price: 44, hsnCode: "2106", unit: Unit.PC },
    { name: "Decha Red 100g", price: 44, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Bisleri 5L", price: 68, hsnCode: "2201", unit: Unit.PC },
  
    { name: "Nariyal Pera", price: 480, hsnCode: "2106", unit: Unit.KG },
    { name: "Atta Khasta", price: 60, hsnCode: "2106", unit: Unit.PC },
    { name: "Maida Khasta", price: 50, hsnCode: "2106", unit: Unit.PC },
    { name: "Mitha Saloni", price: 60, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Banana Chips 100g", price: 40, hsnCode: "2106", unit: Unit.PC },
    { name: "Karela Chips 100g", price: 60, hsnCode: "2106", unit: Unit.PC },
    { name: "Potato Chips 100g", price: 35, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Kachori", price: 15, hsnCode: "996331", unit: Unit.PC },
    { name: "Chakoli", price: 60, hsnCode: "2106", unit: Unit.PC },
    { name: "Bhakarwadi 1 Packet", price: 50, hsnCode: "2106", unit: Unit.PC },
    { name: "Falahari Mixture", price: 50, hsnCode: "2106", unit: Unit.PC },
    { name: "Gupchup", price: 35, hsnCode: "996331", unit: Unit.PC },
  
    { name: "Haldiram Khata Meetha 350g", price: 95, hsnCode: "2106", unit: Unit.PC },
    { name: "All in One Mixture", price: 60, hsnCode: "2106", unit: Unit.PC },
    { name: "Panchratan Mix", price: 85, hsnCode: "2106", unit: Unit.PC },
    { name: "Haldiram Soan Papdi 250g", price: 75, hsnCode: "2106", unit: Unit.PC },
  
    { name: "Bisleri 500ml", price: 10, hsnCode: "2201", unit: Unit.PC },
    { name: "Bisleri 1L", price: 20, hsnCode: "2201", unit: Unit.PC },
  ];

const allProducts = [
  ...products,
  ...productsBatch2,
  ...productsBatch3,
  ...productsBatch4,
  ...productsBatch5,
  ...productsBatch6,
  ...productsBatch7,
];

export const productMap = new Map<string, any[]>();

for (const item of allProducts) {
  const baseName = cleanName(item.name).toLowerCase();

  if (!productMap.has(baseName)) {
    productMap.set(baseName, []);
  }

  productMap.get(baseName)!.push(item);
}