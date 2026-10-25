const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const results = document.getElementById("results");
const status = document.getElementById("status");
const searchButton = document.getElementById("search-button");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const query = input.value.trim();

    if (query === "") {
        status.textContent = "Please enter a search term.";
        input.focus();
        return;
    }

    // Clear previous results.
    results.replaceChildren();

    // Display the loading message.
    const loadingMessage = document.createElement("p");
    loadingMessage.className = "empty-message";
    loadingMessage.textContent = "Searching...";
    results.appendChild(loadingMessage);

    status.textContent = "Searching...";
    searchButton.disabled = true;

    const url = new URL(
        "https://commons.wikimedia.org/w/api.php"
    );

    url.search = new URLSearchParams({
        action: "query",
        generator: "search",
        gsrsearch: query,
        gsrnamespace: "6",
        gsrlimit: "20",
        prop: "imageinfo",
        iiprop: "url",
        iiurlwidth: "400",
        format: "json",
        origin: "*"
    }).toString();

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Failed to fetch images.");
        }

        const data = await response.json();

        const images = Object.values(
            data.query?.pages || {}
        );

        // Keep only results with a usable image URL.
        const validImages = images.filter(function (item) {
            return item.imageinfo?.[0]?.thumburl ||
                   item.imageinfo?.[0]?.url;
        });

        results.replaceChildren();

        if (validImages.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "empty-message";
            emptyMessage.textContent =
                "No images found. Try another search.";

            results.appendChild(emptyMessage);
            status.textContent = "0 images found.";
            return;
        }

        validImages.forEach(function (item) {
            const imageInfo = item.imageinfo[0];
            const imageUrl = imageInfo.thumburl || imageInfo.url;

            const card = document.createElement("div");
            card.className = "image-card";

            const img = document.createElement("img");
            img.src = imageUrl;
            img.alt = item.title.replace(/^File:/, "");
            img.loading = "lazy";

            const caption = document.createElement("p");
            caption.textContent = item.title.replace(/^File:/, "");

            // Handle images that fail to load.
            img.addEventListener("error", function () {
                card.remove();

                if (results.querySelector(".image-card") === null) {
                    const message = document.createElement("p");
                    message.className = "empty-message";
                    message.textContent =
                        "Unable to display images. Try another search.";

                    results.replaceChildren(message);
                    status.textContent = "No images could be displayed.";
                } else {
                    status.textContent =
                        `${results.querySelectorAll(".image-card").length} images displayed.`;
                }
            });

            card.appendChild(img);
            card.appendChild(caption);
            results.appendChild(card);
        });

        const count = results.querySelectorAll(".image-card").length;

        status.textContent =
            `${count} images found for "${query}".`;

    } catch (error) {
        console.error("Image search error:", error);

        results.replaceChildren();

        const errorMessage = document.createElement("p");
        errorMessage.className = "empty-message";
        errorMessage.textContent =
            "Unable to load images. Please check your connection and try again.";

        results.appendChild(errorMessage);
        status.textContent = "Image search failed.";

    } finally {
        searchButton.disabled = false;
    }
});

// Category buttons automatically start a search.
const categories = document.querySelectorAll(
    ".categories button"
);

categories.forEach(function (button) {
    button.addEventListener("click", function () {
        input.value = button.textContent.trim();
        form.requestSubmit();
    });
});