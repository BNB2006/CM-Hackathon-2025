// Global Variables
let cart = []
let selectedTable = null
let tableBooked = false
let refreshCount = 0
const priceIncreasePercentage = 5 // 5% increase after 3 refreshes
const refreshThreshold = 3 // Number of refreshes before price increase
let lastRefreshTime = Date.now()
let vipMenuUnlocked = false
let isFirstVisit = !localStorage.getItem("visited")
let discountApplied = false
let paymentTimer = null
let paymentTimeLeft = 120 // 2 minutes in seconds
let blockedUntil = null
let lastBookingAttempt = 0
let menuItems = []
let vipMenuItems = []
let occupiedTables = []
let isDarkMode = localStorage.getItem("darkMode") === "true"

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  // Apply dark mode if saved in localStorage
  if (isDarkMode) {
    document.body.classList.add("dark")
  }

  // Set first visit flag
  if (isFirstVisit) {
    localStorage.setItem("visited", "true")
    localStorage.setItem("firstVisitTime", Date.now())
  } else {
    // Check if returning within 10 minutes
    const firstVisitTime = Number.parseInt(localStorage.getItem("firstVisitTime") || "0")
    const tenMinutesInMs = 10 * 60 * 1000
    if (Date.now() - firstVisitTime < tenMinutesInMs) {
      // Returning within 10 minutes, no new user discount
      isFirstVisit = false
    } else {
      // It's been more than 10 minutes, treat as new visit
      isFirstVisit = true
      localStorage.setItem("firstVisitTime", Date.now())
    }
  }

  // Get refresh count from localStorage
  refreshCount = Number.parseInt(localStorage.getItem("refreshCount") || "0")
  refreshCount++
  localStorage.setItem("refreshCount", refreshCount.toString())

  // Initialize menu items
  initializeMenu()

  // Initialize restaurant tables
  initializeTables()

  // Update current time display
  updateTimeDisplay()
  setInterval(updateTimeDisplay, 60000) // Update every minute

  // Setup navigation
  setupNavigation()

  // Setup event listeners
  setupEventListeners()

  // Check for URL parameters (for mystery discount)
  checkUrlParameters()

  // Anti-bot measure for refreshes
  window.addEventListener("beforeunload", trackRefresh)

  // Initialize cart from localStorage if available
  const savedCart = localStorage.getItem("cart")
  if (savedCart) {
    cart = JSON.parse(savedCart)
    updateCartCount()
  }

  // Show notification for first-time visitors
  if (isFirstVisit) {
    showNotification("Welcome to Ratatouille! Enjoy a special 15% discount on your first order.", "success")
  }
})

// Initialize menu items
function initializeMenu() {
  // Check if we have stored prices from previous session
  const storedMenuItems = localStorage.getItem("menuItems")

  // Initialize base menu items if not already stored
  if (!storedMenuItems) {
    menuItems = [
      {
        id: 1,
        name: "Classic Caesar Salad",
        description: "Crisp romaine lettuce with our homemade Caesar dressing, croutons, and parmesan cheese.",
        price: 250,
        image:
          "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        category: "starters",
      },
      {
        id: 2,
        name: "Garlic Bread Basket",
        description: "Warm, toasted bread with garlic butter and herbs.",
        price: 180,
        image: "https://www.thecomfortofcooking.com/wp-content/uploads/2018/10/Cheesy_Pull_Apart_Garlic_Bread-2.jpg",
        category: "starters",
      },
      {
        id: 3,
        name: "Margherita Pizza",
        description: "Classic pizza with tomato sauce, mozzarella, and fresh basil.",
        price: 350,
        image:
          "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
        category: "mains",
      },
      {
        id: 4,
        name: "Grilled Salmon",
        description: "Fresh salmon fillet grilled to perfection, served with seasonal vegetables.",
        price: 550,
        image:
          "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        category: "mains",
      },
      {
        id: 5,
        name: "Chocolate Lava Cake",
        description: "Warm chocolate cake with a molten center, served with vanilla ice cream.",
        price: 280,
        image:
          "https://images.unsplash.com/photo-1617305855058-336d24456869?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
        category: "desserts",
      },
      {
        id: 6,
        name: "Tiramisu",
        description: "Classic Italian dessert with layers of coffee-soaked ladyfingers and mascarpone cream.",
        price: 320,
        image:
          "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1025&q=80",
        category: "desserts",
      },
      {
        id: 7,
        name: "Cappuccino",
        description: "Espresso with steamed milk and a layer of foamed milk.",
        price: 150,
        image:
          "https://images.unsplash.com/photo-1534778101976-62847782c213?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        category: "beverages",
      },
      {
        id: 8,
        name: "Fresh Orange Juice",
        description: "Freshly squeezed orange juice.",
        price: 120,
        image:
          "https://images.unsplash.com/photo-1613478223719-2ab802602423?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
        category: "beverages",
      },
      {
        id: 9,
        name: "Spaghetti Carbonara",
        description: "Classic Italian pasta with eggs, cheese, pancetta, and black pepper.",
        price: 380,
        image:
          "https://images.unsplash.com/photo-1612874742237-6526221588e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80",
        category: "mains",
      },
      {
        id: 10,
        name: "Chicken Tikka Masala",
        description: "Grilled chicken in a creamy tomato sauce, served with rice.",
        price: 420,
        image:
          "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1071&q=80",
        category: "mains",
      },
      {
        id: 11,
        name: "Mango Smoothie",
        description: "Refreshing smoothie made with fresh mangoes and yogurt.",
        price: 180,
        image:
          "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
        category: "beverages",
      },
      {
        id: 12,
        name: "Bruschetta",
        description: "Toasted bread topped with diced tomatoes, garlic, basil, and olive oil.",
        price: 220,
        image:
          "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80",
        category: "starters",
      },
    ]

    // Store the initial menu items
    localStorage.setItem("menuItems", JSON.stringify(menuItems))
  } else {
    // Load stored menu items
    menuItems = JSON.parse(storedMenuItems)

    // Check if we've reached the refresh threshold
    if (refreshCount >= refreshThreshold) {
      // Increase all prices by the defined percentage
      menuItems.forEach((item) => {
        // Store original price before increase for display purposes
        item.originalPrice = item.price
        // Increase the price
        item.price = Math.round(item.price * (1 + priceIncreasePercentage / 100))
      })

      // Store the updated menu items
      localStorage.setItem("menuItems", JSON.stringify(menuItems))

      // Reset refresh count
      refreshCount = 0
      localStorage.setItem("refreshCount", "0")

      // Show notification about price increase
      setTimeout(() => {
        showNotification(
          `Food prices have increased by ${priceIncreasePercentage}% due to market fluctuations.`,
          "warning",
        )
      }, 1500)
    }
  }

  vipMenuItems = [
    {
      id: 101,
      name: "Wagyu Beef Steak",
      description: "Premium Japanese Wagyu beef steak, grilled to perfection.",
      price: 1200,
      image:
        "https://images.unsplash.com/photo-1504973960431-1c467e159aa4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      category: "vip",
    },
    {
      id: 102,
      name: "Truffle Risotto",
      description: "Creamy risotto with black truffle and parmesan cheese.",
      price: 850,
      image:
        "https://i0.wp.com/thefoodieglobetrotter.com/wp-content/uploads/2020/05/Takeout-Kit-Italian-Mushroom-Truffle-Risotto-Meal-Kit-1.jpg?w=1440",
      category: "vip",
    },
    {
      id: 103,
      name: "Lobster Thermidor",
      description: "Lobster cooked in a rich, creamy sauce with mushrooms and cognac.",
      price: 1500,
      image:
        "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
      category: "vip",
    },
  ]

  // Apply time-based pricing
  applyTimePricing()

  // Render menu items
  renderMenu("all")
}

// Initialize restaurant tables
function initializeTables() {
  const tablesContainer = document.querySelector(".tables-container")
  if (!tablesContainer) return

  // Clear existing tables
  tablesContainer.innerHTML = ""

  // Generate random occupied tables (30-70% of tables)
  const totalTables = 9
  const occupiedCount = Math.floor(Math.random() * (totalTables * 0.4) + totalTables * 0.3)

  occupiedTables = []
  while (occupiedTables.length < occupiedCount) {
    const tableNum = Math.floor(Math.random() * totalTables) + 1
    if (!occupiedTables.includes(tableNum)) {
      occupiedTables.push(tableNum)
    }
  }

  // Create tables
  for (let i = 1; i <= totalTables; i++) {
    const tableElement = document.createElement("div")
    tableElement.className = `table ${occupiedTables.includes(i) ? "occupied" : "available"}`
    tableElement.dataset.table = i

    // Add table number with better styling
    const tableNumber = document.createElement("div")
    tableNumber.className = "table-number"
    tableNumber.textContent = i
    tableElement.appendChild(tableNumber)

    // Add click event for available tables
    if (!occupiedTables.includes(i)) {
      tableElement.addEventListener("click", () => {
        selectTable(i)
      })
    }

    tablesContainer.appendChild(tableElement)
  }

  // Check if all tables are occupied
  if (occupiedTables.length === totalTables) {
    const bookingMessage = document.getElementById("booking-message")
    bookingMessage.textContent = "All tables are currently occupied. You are on the waiting list."
    bookingMessage.className = "message warning"
    bookingMessage.style.display = "block"
  }
}

// Apply time-based pricing to menu items
function applyTimePricing() {
  const now = new Date()
  const hour = now.getHours()

  // Reset all discounts first
  menuItems.forEach((item) => {
    item.discount = 0
    // Don't reset originalPrice here, as we want to keep the pre-refresh price
  })

  // Morning discount on beverages (8 AM - 11 AM)
  if (hour >= 8 && hour < 11) {
    menuItems.forEach((item) => {
      if (item.category === "beverages") {
        if (!item.originalPrice) item.originalPrice = item.price
        item.price = Math.round(item.price * 0.9) // 10% discount
        item.discount = 10
      }
    })
  }

  // Afternoon peak hours (12 PM - 3 PM)
  else if (hour >= 12 && hour < 15) {
    menuItems.forEach((item) => {
      if (!item.originalPrice) item.originalPrice = item.price
      item.price = Math.round(item.price * 1.15) // 15% increase
    })
  }

  // Evening random discounts (7 PM - 10 PM)
  else if (hour >= 19 && hour < 22) {
    // Select two random items for discount
    const availableIndices = menuItems.map((_, index) => index)
    for (let i = 0; i < 2; i++) {
      if (availableIndices.length === 0) break

      const randomIndex = Math.floor(Math.random() * availableIndices.length)
      const itemIndex = availableIndices.splice(randomIndex, 1)[0]

      // Random discount between 5-20%
      const discountPercent = Math.floor(Math.random() * 16) + 5
      if (!menuItems[itemIndex].originalPrice) menuItems[itemIndex].originalPrice = menuItems[itemIndex].price
      menuItems[itemIndex].price = Math.round(menuItems[itemIndex].price * (1 - discountPercent / 100))
      menuItems[itemIndex].discount = discountPercent
    }
  }

  // Late night surge (10 PM - 12 AM)
  else if (hour >= 22 && hour < 24) {
    menuItems.forEach((item) => {
      if (!item.originalPrice) item.originalPrice = item.price
      item.price = Math.round(item.price * 1.25) // 25% increase
    })
  }

  // Apply anti-bot measure if too many refreshes
  if (refreshCount > 5 && Date.now() - lastRefreshTime < 60000) {
    menuItems.forEach((item) => {
      if (!item.originalPrice) item.originalPrice = item.price
      item.price = Math.round(item.price * 1.05) // 5% increase
    })

    showNotification("Anti-bot measure activated: Prices increased by 5% due to frequent page refreshes.", "warning")
  }

  // Store the updated menu items
  localStorage.setItem("menuItems", JSON.stringify(menuItems))
}

// Update time display
function updateTimeDisplay() {
  const now = new Date()
  const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const dateString = now.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  // Update all time displays
  document.querySelectorAll("#current-time-display, #menu-time-display").forEach((el) => {
    if (el) el.textContent = `${timeString} - ${dateString}`
  })

  // Update time-based message
  const hour = now.getHours()
  let timeMessage = ""

  if (hour >= 8 && hour < 11) {
    timeMessage = "Morning Special: 10% off all beverages!"
  } else if (hour >= 12 && hour < 15) {
    timeMessage = "Peak Hours: Prices are 15% higher during lunch time."
  } else if (hour >= 19 && hour < 22) {
    timeMessage = "Evening Deals: Two random items have special discounts!"
  } else if (hour >= 22 && hour < 24) {
    timeMessage = "Late Night Surge: All prices are 25% higher for last orders."
  } else {
    timeMessage = "Welcome to Ratatouille! Explore our menu."
  }

  const timeBasedMessage = document.getElementById("time-based-message")
  if (timeBasedMessage) timeBasedMessage.textContent = timeMessage

  // Re-apply time-based pricing and update menu
  applyTimePricing()
  const activeFilter = document.querySelector(".filter-btn.active")
  if (activeFilter) {
    renderMenu(activeFilter.dataset.filter)
  }
}

// Setup navigation
function setupNavigation() {
  const navLinks = document.querySelectorAll(".nav-links a")
  const sections = document.querySelectorAll(".section")
  const hamburger = document.querySelector(".hamburger")
  const navLinksContainer = document.querySelector(".nav-links")
  const themeToggle = document.getElementById("theme-toggle")

  // Handle theme toggle
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleDarkMode)
  }

  // Handle navigation clicks
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()

      const targetId = this.getAttribute("href").substring(1)

      // Update active link
      navLinks.forEach((link) => link.classList.remove("active"))
      this.classList.add("active")

      // Show target section
      sections.forEach((section) => {
        section.classList.remove("active")
        if (section.id === targetId) {
          section.classList.add("active")

          // Special handling for cart section
          if (targetId === "cart") {
            updateCart()
          }
        }
      })

      // Close mobile menu if open
      if (navLinksContainer.classList.contains("active")) {
        navLinksContainer.classList.remove("active")
        hamburger.classList.remove("active")
      }

      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" })
    })
  })

  // Handle hamburger menu
  if (hamburger) {
    hamburger.addEventListener("click", function () {
      this.classList.toggle("active")
      navLinksContainer.classList.toggle("active")
    })
  }
}

// Toggle dark mode
function toggleDarkMode() {
  document.body.classList.toggle("dark")
  isDarkMode = document.body.classList.contains("dark")
  localStorage.setItem("darkMode", isDarkMode)

  // Show notification
  showNotification(`${isDarkMode ? "Dark" : "Light"} mode activated`, "success")
}

// Setup event listeners
function setupEventListeners() {
  // Home page buttons
  const viewMenuBtn = document.getElementById("view-menu-btn")
  const bookTableBtn = document.getElementById("book-table-btn")

  if (viewMenuBtn) {
    viewMenuBtn.addEventListener("click", () => {
      navigateTo("menu")
    })
  }

  if (bookTableBtn) {
    bookTableBtn.addEventListener("click", () => {
      navigateTo("booking")
    })
  }

  // Menu filter buttons
  const filterBtns = document.querySelectorAll(".filter-btn")
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      filterBtns.forEach((b) => b.classList.remove("active"))
      this.classList.add("active")
      renderMenu(this.dataset.filter)
    })
  })

  // Table booking form
  const tableBookingForm = document.getElementById("table-booking-form")
  if (tableBookingForm) {
    tableBookingForm.addEventListener("submit", (e) => {
      e.preventDefault()
      bookTable()
    })
  }

  // Cart empty button
  const emptyCartMenuBtn = document.getElementById("empty-cart-menu-btn")
  if (emptyCartMenuBtn) {
    emptyCartMenuBtn.addEventListener("click", () => {
      navigateTo("menu")
    })
  }

  // Proceed to payment button
  const proceedToPaymentBtn = document.getElementById("proceed-to-payment-btn")
  if (proceedToPaymentBtn) {
    proceedToPaymentBtn.addEventListener("click", () => {
      if (!tableBooked) {
        showNotification("Please book a table before proceeding to payment.", "error")
        document.getElementById("table-warning").classList.remove("hidden")
        return
      }

      if (cart.length === 0) {
        showNotification("Your cart is empty. Please add items to your cart.", "error")
        return
      }

      navigateTo("payment")
      startPaymentTimer()
      renderPaymentSummary()
    })
  }

  // Apply discount button
  const applyDiscountBtn = document.getElementById("apply-discount-btn")
  if (applyDiscountBtn) {
    applyDiscountBtn.addEventListener("click", () => {
      applyDiscount()
    })
  }

  // Payment form
  const paymentForm = document.getElementById("payment-form")
  if (paymentForm) {
    paymentForm.addEventListener("submit", (e) => {
      e.preventDefault()
      processPayment()
    })
  }

  // Back to home button
  const backToHomeBtn = document.getElementById("back-to-home-btn")
  if (backToHomeBtn) {
    backToHomeBtn.addEventListener("click", () => {
      // Reset cart and booking
      cart = []
      selectedTable = null
      tableBooked = false
      discountApplied = false
      localStorage.removeItem("cart")
      updateCartCount()

      navigateTo("home")
    })
  }

  // Mystery discount link
  const mysteryLink = document.getElementById("mystery-link")
  if (mysteryLink) {
    mysteryLink.addEventListener("click", (e) => {
      e.preventDefault()

      // Add mystery discount to URL
      const url = new URL(window.location.href)
      url.searchParams.set("mystery", "true")
      window.history.pushState({}, "", url)

      showNotification("Congratulations! You found the mystery discount. 20% off your next order!", "success")
      localStorage.setItem("mysteryDiscount", "true")
    })
  }

  // Format card inputs
  const cardNumber = document.getElementById("card-number")
  if (cardNumber) {
    cardNumber.addEventListener("input", function () {
      this.value = this.value
        .replace(/[^\d]/g, "")
        .replace(/(.{4})/g, "$1 ")
        .trim()
    })
  }

  const cardExpiry = document.getElementById("card-expiry")
  if (cardExpiry) {
    cardExpiry.addEventListener("input", function () {
      this.value = this.value
        .replace(/[^\d]/g, "")
        .replace(/(.{2})/, "$1/")
        .substr(0, 5)
    })
  }

  const cardCvv = document.getElementById("card-cvv")
  if (cardCvv) {
    cardCvv.addEventListener("input", function () {
      this.value = this.value.replace(/[^\d]/g, "")
    })
  }

  // Notification close button
  const notificationClose = document.getElementById("notification-close")
  if (notificationClose) {
    notificationClose.addEventListener("click", () => {
      document.getElementById("notification").classList.add("hidden")
    })
  }
}

// Check URL parameters for mystery discount
function checkUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get("mystery") === "true") {
    localStorage.setItem("mysteryDiscount", "true")
  }
}

// Track page refreshes for anti-bot measure
function trackRefresh() {
  const now = Date.now()

  // Only count refreshes within a minute
  if (now - lastRefreshTime < 60000) {
    refreshCount++
  } else {
    refreshCount = 1
  }

  lastRefreshTime = now
  localStorage.setItem("refreshCount", refreshCount.toString())
  localStorage.setItem("lastRefreshTime", lastRefreshTime)
}

// Navigate to a section
function navigateTo(sectionId) {
  // Update active link
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.remove("active")
    if (link.getAttribute("href") === `#${sectionId}`) {
      link.classList.add("active")
    }
  })

  // Show target section
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active")
    if (section.id === sectionId) {
      section.classList.add("active")

      // Special handling for cart section
      if (sectionId === "cart") {
        updateCart()
      }
    }
  })

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" })
}

// Render menu items
function renderMenu(filter) {
  const menuContainer = document.getElementById("menu-items-container")
  if (!menuContainer) return

  // Clear existing items
  menuContainer.innerHTML = ""

  // Filter items
  let filteredItems = menuItems
  if (filter !== "all") {
    filteredItems = menuItems.filter((item) => item.category === filter)
  }

  // Render each item
  filteredItems.forEach((item) => {
    const menuItem = document.createElement("div")
    menuItem.className = "menu-item"

    // Add discount badge if applicable
    if (item.discount && item.discount > 0) {
      const discountBadge = document.createElement("div")
      discountBadge.className = "discount-badge"
      discountBadge.textContent = `${item.discount}% OFF`
      menuItem.appendChild(discountBadge)
    }

    menuItem.innerHTML += `
            <div class="menu-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="menu-item-content">
                <h3 class="menu-item-title">${item.name}</h3>
                <p class="menu-item-description">${item.description}</p>
                <div class="menu-item-price">
                    ${item.originalPrice ? `<span class="original-price">₹${item.originalPrice.toFixed(2)}</span>` : ""}
                    ₹${item.price.toFixed(2)}
                </div>
                <button class="add-to-cart-btn" data-id="${item.id}">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        `

    menuContainer.appendChild(menuItem)
  })

  // Add event listeners to add-to-cart buttons
  document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const itemId = Number.parseInt(this.dataset.id)
      addToCart(itemId)
    })
  })

  // Show/hide VIP menu
  const vipMenuTeaser = document.getElementById("vip-menu-teaser")
  const vipMenu = document.getElementById("vip-menu")

  // Check if cart total is ₹1000 or more
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  if (cartTotal >= 1000 && !vipMenuUnlocked) {
    vipMenuUnlocked = true
    showNotification("Congratulations! You've unlocked the exclusive VIP menu!", "success")
  }

  if (vipMenuUnlocked) {
    if (vipMenuTeaser) vipMenuTeaser.classList.add("hidden")
    if (vipMenu) {
      vipMenu.classList.remove("hidden")

      // Render VIP menu items
      const vipMenuItemsContainer = vipMenu.querySelector(".vip-menu-items")
      if (vipMenuItemsContainer) {
        vipMenuItemsContainer.innerHTML = ""

        vipMenuItems.forEach((item) => {
          const menuItem = document.createElement("div")
          menuItem.className = "menu-item"

          menuItem.innerHTML = `
                        <div class="menu-item-image">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="menu-item-content">
                            <h3 class="menu-item-title">${item.name}</h3>
                            <p class="menu-item-description">${item.description}</p>
                            <div class="menu-item-price">₹${item.price.toFixed(2)}</div>
                            <button class="add-to-cart-btn" data-id="${item.id}">
                                <i class="fas fa-cart-plus"></i> Add to Cart
                            </button>
                        </div>
                    `

          vipMenuItemsContainer.appendChild(menuItem)
        })

        // Add event listeners to VIP add-to-cart buttons
        vipMenuItemsContainer.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
          btn.addEventListener("click", function () {
            const itemId = Number.parseInt(this.dataset.id)
            addToCart(itemId, true)
          })
        })
      }
    }
  } else {
    if (vipMenuTeaser) vipMenuTeaser.classList.remove("hidden")
    if (vipMenu) vipMenu.classList.add("hidden")
  }
}

// Add item to cart
function addToCart(itemId, isVip = false) {
  // Find the item
  const item = isVip ? vipMenuItems.find((item) => item.id === itemId) : menuItems.find((item) => item.id === itemId)

  if (!item) return

  // Check if item is already in cart
  const existingItem = cart.find((cartItem) => cartItem.id === itemId)

  if (existingItem) {
    existingItem.quantity++
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      isVip: isVip,
    })
  }

  // Save cart to localStorage
  localStorage.setItem("cart", JSON.stringify(cart))

  // Update cart count
  updateCartCount()

  // Show notification
  showNotification(`${item.name} added to cart!`, "success")

  // Check if VIP menu should be unlocked
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  if (cartTotal >= 1000 && !vipMenuUnlocked) {
    vipMenuUnlocked = true
    showNotification("Congratulations! You've unlocked the exclusive VIP menu!", "success")

    // Re-render menu to show VIP items
    const activeFilter = document.querySelector(".filter-btn.active")
    if (activeFilter) {
      renderMenu(activeFilter.dataset.filter)
    }
  }
}

// Update cart count in navigation
function updateCartCount() {
  const cartCount = document.getElementById("cart-count")
  if (cartCount) {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0)
    cartCount.textContent = totalItems
  }
}

// Update cart display
function updateCart() {
  const cartItemsContainer = document.getElementById("cart-items-container")
  const emptyCartMessage = document.getElementById("empty-cart-message")
  const cartContainer = document.querySelector(".cart-container")
  const tableWarning = document.getElementById("table-warning")

  if (!cartItemsContainer || !emptyCartMessage || !cartContainer) return

  // Show/hide elements based on cart state
  if (cart.length === 0) {
    cartContainer.style.display = "none"
    emptyCartMessage.style.display = "block"
    return
  } else {
    cartContainer.style.display = "block"
    emptyCartMessage.style.display = "none"
  }

  // Show/hide table warning
  if (tableWarning) {
    tableWarning.classList.toggle("hidden", tableBooked)
  }

  // Clear existing items
  cartItemsContainer.innerHTML = ""

  // Render each cart item
  cart.forEach((item) => {
    const cartItem = document.createElement("div")
    cartItem.className = "cart-item"

    cartItem.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h3 class="cart-item-title">${item.name}</h3>
                <p class="cart-item-price">₹${item.price.toFixed(2)}</p>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-control">
                    <button class="quantity-btn decrease" data-id="${item.id}" data-vip="${item.isVip}">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn increase" data-id="${item.id}" data-vip="${item.isVip}">+</button>
                </div>
                <button class="remove-item-btn" data-id="${item.id}" data-vip="${item.isVip}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `

    cartItemsContainer.appendChild(cartItem)
  })

  // Add event listeners to cart controls
  document.querySelectorAll(".quantity-btn.decrease").forEach((btn) => {
    btn.addEventListener("click", function () {
      const itemId = Number.parseInt(this.dataset.id)
      const isVip = this.dataset.vip === "true"
      updateCartItemQuantity(itemId, -1, isVip)
    })
  })

  document.querySelectorAll(".quantity-btn.increase").forEach((btn) => {
    btn.addEventListener("click", function () {
      const itemId = Number.parseInt(this.dataset.id)
      const isVip = this.dataset.vip === "true"
      updateCartItemQuantity(itemId, 1, isVip)
    })
  })

  document.querySelectorAll(".remove-item-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const itemId = Number.parseInt(this.dataset.id)
      const isVip = this.dataset.vip === "true"
      removeCartItem(itemId, isVip)
    })
  })

  // Update cart summary
  updateCartSummary()
}

// Update cart item quantity
function updateCartItemQuantity(itemId, change, isVip) {
  const itemIndex = cart.findIndex((item) => item.id === itemId && item.isVip === isVip)
  if (itemIndex === -1) return

  cart[itemIndex].quantity += change

  // Remove item if quantity is 0 or less
  if (cart[itemIndex].quantity <= 0) {
    cart.splice(itemIndex, 1)
  }

  // Save cart to localStorage
  localStorage.setItem("cart", JSON.stringify(cart))

  // Update cart display
  updateCart()
  updateCartCount()
}

// Remove item from cart
function removeCartItem(itemId, isVip) {
  const itemIndex = cart.findIndex((item) => item.id === itemId && item.isVip === isVip)
  if (itemIndex === -1) return

  const itemName = cart[itemIndex].name

  // Remove item
  cart.splice(itemIndex, 1)

  // Save cart to localStorage
  localStorage.setItem("cart", JSON.stringify(cart))

  // Update cart display
  updateCart()
  updateCartCount()

  // Show notification
  showNotification(`${itemName} removed from cart.`, "success")
}

// Update cart summary
function updateCartSummary() {
  const subtotalElement = document.getElementById("cart-subtotal")
  const taxElement = document.getElementById("cart-tax")
  const totalElement = document.getElementById("cart-total")

  if (!subtotalElement || !taxElement || !totalElement) return

  // Calculate subtotal
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  // Calculate tax (5%)
  const tax = subtotal * 0.05

  // Calculate total
  let total = subtotal + tax

  // Apply discount if applicable
  if (discountApplied) {
    // Get discount percentage
    let discountPercent = 0

    if (isFirstVisit) {
      discountPercent = 15 // New user discount
    } else if (localStorage.getItem("mysteryDiscount") === "true") {
      discountPercent = 20 // Mystery discount
    }

    if (discountPercent > 0) {
      total = total * (1 - discountPercent / 100)
    }
  }

  // Update elements
  subtotalElement.textContent = `₹${subtotal.toFixed(2)}`
  taxElement.textContent = `₹${tax.toFixed(2)}`
  totalElement.textContent = `₹${total.toFixed(2)}`
}

// Apply discount
function applyDiscount() {
  const discountCode = document.getElementById("discount-code").value.trim().toLowerCase()
  const discountMessage = document.getElementById("discount-message")

  if (!discountMessage) return

  // Check if discount is already applied
  if (discountApplied) {
    discountMessage.textContent = "Only one offer per order is allowed."
    discountMessage.className = "message warning"
    discountMessage.classList.remove("hidden")
    return
  }

  // Check discount code
  if (discountCode === "new" && isFirstVisit) {
    discountApplied = true
    discountMessage.textContent = "New user discount (15% off) applied successfully!"
    discountMessage.className = "message success"
  } else if (discountCode === "mystery" && localStorage.getItem("mysteryDiscount") === "true") {
    discountApplied = true
    discountMessage.textContent = "Mystery discount (20% off) applied successfully!"
    discountMessage.className = "message success"
  } else {
    discountMessage.textContent = "Invalid discount code."
    discountMessage.className = "message error"
  }

  discountMessage.classList.remove("hidden")

  // Update cart summary
  updateCartSummary()
}

// Select a table
function selectTable(tableNumber) {
  // Check if booking is blocked
  if (blockedUntil && Date.now() < blockedUntil) {
    const remainingTime = Math.ceil((blockedUntil - Date.now()) / 1000 / 60)
    showNotification(`Booking is temporarily blocked. Please try again in ${remainingTime} minutes.`, "error")
    return
  }

  // Check for rapid booking attempts
  const now = Date.now()
  if (lastBookingAttempt > 0 && now - lastBookingAttempt < 30000) {
    // Block for 5 minutes
    blockedUntil = now + 5 * 60 * 1000
    showNotification("Too many booking attempts. Booking is blocked for 5 minutes.", "error")
    return
  }

  lastBookingAttempt = now

  // Update selected table
  selectedTable = tableNumber

  // Update table display
  document.querySelectorAll(".table").forEach((table) => {
    if (Number.parseInt(table.dataset.table) === tableNumber) {
      table.classList.add("selected")
      table.classList.remove("available")
    } else if (!occupiedTables.includes(Number.parseInt(table.dataset.table))) {
      table.classList.remove("selected")
      table.classList.add("available")
    }
  })

  // Update selected table display
  const selectedTableDisplay = document.getElementById("selected-table-display")
  if (selectedTableDisplay) {
    selectedTableDisplay.textContent = tableNumber
  }

  // Show a notification
  showNotification(`Table ${tableNumber} selected`, "success")
}

// Book a table
function bookTable() {
  // Check if a table is selected
  if (!selectedTable) {
    showNotification("Please select a table first.", "error")
    return
  }

  // Get form data
  const name = document.getElementById("customer-name").value
  const email = document.getElementById("customer-email").value
  const phone = document.getElementById("customer-phone").value
  const guests = document.getElementById("guests").value
  const date = document.getElementById("booking-date").value
  const time = document.getElementById("booking-time").value

  // Validate form data
  if (!name || !email || !phone || !guests || !date || !time) {
    showNotification("Please fill in all fields.", "error")
    return
  }

  // Set table as booked
  tableBooked = true

  // Show success message
  const bookingMessage = document.getElementById("booking-message")
  if (bookingMessage) {
    bookingMessage.textContent = `Table ${selectedTable} booked successfully for ${date} at ${time}!`
    bookingMessage.className = "message success"
    bookingMessage.classList.remove("hidden")
  }

  // Show notification
  showNotification("Table booked successfully! You can now proceed to order.", "success")
}

// Start payment timer
function startPaymentTimer() {
  // Clear existing timer
  if (paymentTimer) {
    clearInterval(paymentTimer)
  }

  // Reset time left
  paymentTimeLeft = 120 // 2 minutes

  // Update countdown display
  updatePaymentCountdown()

  // Start timer
  paymentTimer = setInterval(() => {
    paymentTimeLeft--

    // Update countdown display
    updatePaymentCountdown()

    // Check if time is up
    if (paymentTimeLeft <= 0) {
      clearInterval(paymentTimer)

      // Show session expired message
      const paymentMessage = document.getElementById("payment-message")
      if (paymentMessage) {
        paymentMessage.textContent = "Session expired. Your cart has been reset."
        paymentMessage.className = "message error"
        paymentMessage.classList.remove("hidden")
      }

      // Reset cart
      cart = []
      localStorage.removeItem("cart")
      updateCartCount()

      // Navigate back to cart after 3 seconds
      setTimeout(() => {
        navigateTo("cart")
        updateCart()
      }, 3000)
    }
  }, 1000)
}

// Update payment countdown display
function updatePaymentCountdown() {
  const countdownElement = document.getElementById("payment-countdown")
  if (!countdownElement) return

  const minutes = Math.floor(paymentTimeLeft / 60)
  const seconds = paymentTimeLeft % 60

  countdownElement.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`

  // Change color when time is running out
  if (paymentTimeLeft <= 30) {
    countdownElement.style.color = "#d63031"
  }
}

// Render payment summary
function renderPaymentSummary() {
  const paymentItemsContainer = document.getElementById("payment-items-container")
  const paymentTotal = document.getElementById("payment-total")

  if (!paymentItemsContainer || !paymentTotal) return

  // Clear existing items
  paymentItemsContainer.innerHTML = ""

  // Render each cart item
  cart.forEach((item) => {
    const paymentItem = document.createElement("div")
    paymentItem.className = "payment-item"

    paymentItem.innerHTML = `
            <div class="payment-item-name">
                <span class="payment-item-quantity">${item.quantity}</span>
                ${item.name}
            </div>
            <div class="payment-item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
        `

    paymentItemsContainer.appendChild(paymentItem)
  })

  // Calculate total
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const tax = subtotal * 0.05
  let total = subtotal + tax

  // Apply discount if applicable
  if (discountApplied) {
    // Get discount percentage
    let discountPercent = 0

    if (isFirstVisit) {
      discountPercent = 15 // New user discount
    } else if (localStorage.getItem("mysteryDiscount") === "true") {
      discountPercent = 20 // Mystery discount
    }

    if (discountPercent > 0) {
      total = total * (1 - discountPercent / 100)
    }
  }

  // Update total
  paymentTotal.textContent = `₹${total.toFixed(2)}`
}

// Process payment
function processPayment() {
  // Clear payment timer
  if (paymentTimer) {
    clearInterval(paymentTimer)
  }

  // Random chance for payment failure (10%)
  const randomFailure = Math.random() < 0.1

  if (randomFailure) {
    // Show payment failed message
    const paymentMessage = document.getElementById("payment-message")
    if (paymentMessage) {
      paymentMessage.textContent = "Payment failed. Please try again."
      paymentMessage.className = "message error"
      paymentMessage.classList.remove("hidden")
    }

    // Allow retry
    return
  }

  // Payment successful
  // Generate order number
  const orderNumber = Math.floor(100000 + Math.random() * 900000)

  // Set order details
  document.getElementById("order-number").textContent = orderNumber
  document.getElementById("order-table").textContent = selectedTable

  // Calculate total
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const tax = subtotal * 0.05
  let total = subtotal + tax

  // Apply discount if applicable
  if (discountApplied) {
    // Get discount percentage
    let discountPercent = 0

    if (isFirstVisit) {
      discountPercent = 15 // New user discount
    } else if (localStorage.getItem("mysteryDiscount") === "true") {
      discountPercent = 20 // Mystery discount
    }

    if (discountPercent > 0) {
      total = total * (1 - discountPercent / 100)
    }
  }

  document.getElementById("order-amount").textContent = `₹${total.toFixed(2)}`

  // Navigate to confirmation
  navigateTo("confirmation")

  // Reset cart and booking
  setTimeout(() => {
    cart = []
    localStorage.removeItem("cart")
    updateCartCount()
  }, 1000)
}

// Show notification
function showNotification(message, type) {
  const notification = document.getElementById("notification")
  const notificationMessage = document.getElementById("notification-message")

  if (!notification || !notificationMessage) return

  // Set message and type
  notificationMessage.textContent = message
  notification.className = `notification ${type}`

  // Show notification
  notification.classList.remove("hidden")

  // Auto-hide after 5 seconds
  setTimeout(() => {
    notification.classList.add("hidden")
  }, 5000)
}

// Every 10 minutes in the evening, update random discounts
setInterval(
  () => {
    const now = new Date()
    const hour = now.getHours()

    // Only apply in evening hours (7 PM - 10 PM)
    if (hour >= 19 && hour < 22) {
      // Reset all evening discounts
      menuItems.forEach((item) => {
        if (item.discount > 0) {
          item.price = item.originalPrice
          item.discount = 0
          item.originalPrice = null
        }
      })

      // Select two random items for discount
      const availableIndices = menuItems.map((_, index) => index)
      for (let i = 0; i < 2; i++) {
        if (availableIndices.length === 0) break

        const randomIndex = Math.floor(Math.random() * availableIndices.length)
        const itemIndex = availableIndices.splice(randomIndex, 1)[0]

        // Random discount between 5-20%
        const discountPercent = Math.floor(Math.random() * 16) + 5
        menuItems[itemIndex].originalPrice = menuItems[itemIndex].price
        menuItems[itemIndex].price = Math.round(menuItems[itemIndex].price * (1 - discountPercent / 100))
        menuItems[itemIndex].discount = discountPercent
      }

      // Re-render menu
      const activeFilter = document.querySelector(".filter-btn.active")
      if (activeFilter && document.getElementById("menu").classList.contains("active")) {
        renderMenu(activeFilter.dataset.filter)
        showNotification("Evening special discounts have been updated!", "success")
      }
    }
  },
  10 * 60 * 1000,
) // Every 10 minutes

