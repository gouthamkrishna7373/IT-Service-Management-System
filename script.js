"use strict";

// Browser storage helpers
function loadData(key) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Could not load " + key, error);
        return [];
    }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

let tickets = loadData("itsp_tickets");
let requests = loadData("itsp_requests");
let assets = loadData("itsp_assets");
let clients = loadData("itsp_clients");

const pageNames = {
    dashboard: "Dashboard",
    catalog: "Service Catalog",
    tickets: "Ticket Management",
    requests: "Service Requests",
    assets: "Asset Management",
    clients: "Client Management",
    knowledge: "Knowledge Base",
    reports: "Reports & Analytics"
};

// Safe text output for table cells
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Navigation: this makes every sidebar button work.
document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
        const targetPage = button.dataset.page;

        if (!document.getElementById(targetPage)) {
            console.error("Page not found:", targetPage);
            return;
        }

        document.querySelectorAll(".page").forEach(page => {
            page.classList.remove("active");
        });

        document.querySelectorAll(".nav-link").forEach(nav => {
            nav.classList.remove("active");
        });

        document.getElementById(targetPage).classList.add("active");
        button.classList.add("active");
        document.getElementById("pageTitle").textContent =
            pageNames[targetPage] || "ITServicePro";

        renderAll();
    });
});

// Ticket form visibility
document.getElementById("showTicketForm").addEventListener("click", () => {
    document.getElementById("ticketForm").classList.remove("hidden");
    document.getElementById("ticketTitle").focus();
});

document.getElementById("cancelTicket").addEventListener("click", () => {
    document.getElementById("ticketForm").reset();
    document.getElementById("ticketForm").classList.add("hidden");
});

// Create ticket
document.getElementById("ticketForm").addEventListener("submit", event => {
    event.preventDefault();

    const ticket = {
        id: "TKT-" + Date.now().toString().slice(-7),
        title: document.getElementById("ticketTitle").value.trim(),
        category: document.getElementById("ticketCategory").value,
        priority: document.getElementById("ticketPriority").value,
        assignee: document.getElementById("ticketAssignee").value.trim() || "Unassigned",
        description: document.getElementById("ticketDescription").value.trim(),
        status: "Open",
        createdAt: new Date().toLocaleDateString()
    };

    if (!ticket.title || !ticket.description) {
        alert("Please enter the ticket title and description.");
        return;
    }

    tickets.unshift(ticket);
    saveData("itsp_tickets", tickets);

    event.target.reset();
    event.target.classList.add("hidden");

    renderAll();
    alert("Ticket created successfully!");
});

// Search tickets
document.getElementById("ticketSearch").addEventListener("input", renderTickets);

// Ticket actions: status change and delete
document.getElementById("ticketTable").addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "status") {
        const ticket = tickets.find(item => item.id === id);
        if (!ticket) return;

        ticket.status = ticket.status === "Resolved" ? "Open" : "Resolved";
        saveData("itsp_tickets", tickets);
        renderAll();
    }

    if (action === "delete") {
        if (!confirm("Delete this ticket?")) return;

        tickets = tickets.filter(item => item.id !== id);
        saveData("itsp_tickets", tickets);
        renderAll();
    }
});

// Create service request
document.getElementById("requestForm").addEventListener("submit", event => {
    event.preventDefault();

    requests.unshift({
        id: "REQ-" + Date.now().toString().slice(-7),
        title: document.getElementById("requestTitle").value.trim(),
        type: document.getElementById("requestType").value,
        date: new Date().toLocaleDateString()
    });

    saveData("itsp_requests", requests);
    event.target.reset();
    renderRequests();
    alert("Service request submitted!");
});

// Add asset
document.getElementById("assetForm").addEventListener("submit", event => {
    event.preventDefault();

    const serial = document.getElementById("assetSerial").value.trim();

    if (assets.some(asset => asset.serial.toLowerCase() === serial.toLowerCase())) {
        alert("That serial number already exists.");
        return;
    }

    assets.unshift({
        id: "AST-" + Date.now(),
        name: document.getElementById("assetName").value.trim(),
        type: document.getElementById("assetType").value,
        serial,
        user: document.getElementById("assetUser").value.trim() || "Unassigned"
    });

    saveData("itsp_assets", assets);
    event.target.reset();
    renderAssets();
    renderDashboard();
    alert("Asset added successfully!");
});

// Asset delete
document.getElementById("assetTable").addEventListener("click", event => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;

    assets = assets.filter(asset => asset.id !== button.dataset.id);
    saveData("itsp_assets", assets);
    renderAll();
});

// Add client
document.getElementById("clientForm").addEventListener("submit", event => {
    event.preventDefault();

    clients.unshift({
        id: "CLI-" + Date.now(),
        name: document.getElementById("clientName").value.trim(),
        email: document.getElementById("clientEmail").value.trim(),
        phone: document.getElementById("clientPhone").value.trim() || "—"
    });

    saveData("itsp_clients", clients);
    event.target.reset();
    renderClients();
    alert("Client added successfully!");
});

// Client delete
document.getElementById("clientTable").addEventListener("click", event => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;

    clients = clients.filter(client => client.id !== button.dataset.id);
    saveData("itsp_clients", clients);
    renderClients();
});

// Dark mode
document.getElementById("darkModeBtn").addEventListener("click", () => {
    document.body.classList.toggle("dark");

    localStorage.setItem(
        "itsp_dark_mode",
        document.body.classList.contains("dark") ? "on" : "off"
    );
});

if (localStorage.getItem("itsp_dark_mode") === "on") {
    document.body.classList.add("dark");
}

// Render tickets table
function renderTickets() {
    const tbody = document.getElementById("ticketTable");
    const query = document.getElementById("ticketSearch").value.trim().toLowerCase();

    const filtered = tickets.filter(ticket =>
        [ticket.id, ticket.title, ticket.category, ticket.priority, ticket.assignee, ticket.status]
            .some(value => String(value || "").toLowerCase().includes(query))
    );

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty">${
            query ? "No matching tickets found." : "No tickets yet. Click Create Ticket to add one."
        }</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(ticket => `
        <tr>
            <td>${escapeHTML(ticket.id)}</td>
            <td title="${escapeHTML(ticket.description || "")}">${escapeHTML(ticket.title)}</td>
            <td>${escapeHTML(ticket.category)}</td>
            <td>${escapeHTML(ticket.priority)}</td>
            <td>${escapeHTML(ticket.assignee)}</td>
            <td>${escapeHTML(ticket.status)}</td>
            <td>
                <button class="small-btn" data-action="status" data-id="${escapeHTML(ticket.id)}">
                    ${ticket.status === "Resolved" ? "Reopen" : "Resolve"}
                </button>
                <button class="small-btn danger-btn" data-action="delete" data-id="${escapeHTML(ticket.id)}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

// Render dashboard
function renderDashboard() {
    const openCount = tickets.filter(ticket => ticket.status === "Open").length;
    const resolvedCount = tickets.filter(ticket => ticket.status === "Resolved").length;

    document.getElementById("totalTickets").textContent = tickets.length;
    document.getElementById("openTickets").textContent = openCount;
    document.getElementById("resolvedTickets").textContent = resolvedCount;
    document.getElementById("totalAssets").textContent = assets.length;

    document.getElementById("reportTotal").textContent = tickets.length;
    document.getElementById("reportOpen").textContent = openCount;
    document.getElementById("reportResolved").textContent = resolvedCount;
    document.getElementById("reportAssets").textContent = assets.length;

    const recent = document.getElementById("recentTickets");

    if (!tickets.length) {
        recent.innerHTML = `<tr><td colspan="4" class="empty">No tickets available yet.</td></tr>`;
        return;
    }

    recent.innerHTML = tickets.slice(0, 5).map(ticket => `
        <tr>
            <td>${escapeHTML(ticket.id)}</td>
            <td>${escapeHTML(ticket.title)}</td>
            <td>${escapeHTML(ticket.priority)}</td>
            <td>${escapeHTML(ticket.status)}</td>
        </tr>
    `).join("");
}

// Render service requests
function renderRequests() {
    const tbody = document.getElementById("requestTable");

    tbody.innerHTML = requests.length
        ? requests.map(request => `
            <tr>
                <td>${escapeHTML(request.id)}</td>
                <td>${escapeHTML(request.title)}</td>
                <td>${escapeHTML(request.type)}</td>
                <td>${escapeHTML(request.date)}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="4" class="empty">No service requests yet.</td></tr>`;
}

// Render assets
function renderAssets() {
    const tbody = document.getElementById("assetTable");

    tbody.innerHTML = assets.length
        ? assets.map(asset => `
            <tr>
                <td>${escapeHTML(asset.name)}</td>
                <td>${escapeHTML(asset.type)}</td>
                <td>${escapeHTML(asset.serial)}</td>
                <td>${escapeHTML(asset.user)}</td>
                <td><button class="small-btn danger-btn" data-id="${escapeHTML(asset.id)}">Delete</button></td>
            </tr>
        `).join("")
        : `<tr><td colspan="5" class="empty">No assets registered yet.</td></tr>`;
}

// Render clients
function renderClients() {
    const tbody = document.getElementById("clientTable");

    tbody.innerHTML = clients.length
        ? clients.map(client => `
            <tr>
                <td>${escapeHTML(client.name)}</td>
                <td>${escapeHTML(client.email)}</td>
                <td>${escapeHTML(client.phone)}</td>
                <td><button class="small-btn danger-btn" data-id="${escapeHTML(client.id)}">Delete</button></td>
            </tr>
        `).join("")
        : `<tr><td colspan="4" class="empty">No clients registered yet.</td></tr>`;
}

// Refresh every page's data
function renderAll() {
    renderTickets();
    renderRequests();
    renderAssets();
    renderClients();
    renderDashboard();
}

// Export tickets as CSV
document.getElementById("exportCsv").addEventListener("click", () => {
    if (!tickets.length) {
        alert("There are no tickets to export yet.");
        return;
    }

    const headers = ["ID", "Title", "Category", "Priority", "Assigned To", "Status", "Description", "Date"];

    const quoteCSV = value =>
        '"' + String(value ?? "").replace(/"/g, '""') + '"';

    const rows = tickets.map(ticket => [
        ticket.id,
        ticket.title,
        ticket.category,
        ticket.priority,
        ticket.assignee,
        ticket.status,
        ticket.description,
        ticket.createdAt
    ]);

    const csv = [headers, ...rows].map(row => row.map(quoteCSV).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "ITServicePro-Tickets.csv";
    link.click();

    URL.revokeObjectURL(url);
});

// Initial page load
renderAll();