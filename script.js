document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("form");
  const searchInput = document.getElementById("searchInput");
  const searchForm = document.getElementById("searchForm");

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    filterBooks(searchInput.value);
  });

  searchInput.addEventListener("input", function () {
    filterBooks(searchInput.value);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    addNewBook();
  });

  if (isStorageExist()) {
    loadDataFromStorage();
  }
});

const books = [];
const RENDER_EVENT = "render-book";

document.addEventListener(RENDER_EVENT, function (event) {
  const uncompletedBookList = document.getElementById("books");
  const completedBookList = document.getElementById("completed-books");

  uncompletedBookList.innerHTML = "";
  completedBookList.innerHTML = "";

  const displayedBooks = event.detail || books;

  for (const bookItem of displayedBooks) {
    const bookElement = createBookElement(bookItem);

    if (!bookItem.isRead) {
      uncompletedBookList.append(bookElement);
    } else {
      completedBookList.append(bookElement);
    }
  }
});

function addNewBook() {
  const titleInput = document.getElementById("titleInput").value;
  const authorInput = document.getElementById("authorInput").value;
  const yearInput = parseInt(document.getElementById("yearInput").value);
  const isReadCheckbox = document.getElementById("isRead");

  if (titleInput && authorInput && yearInput) {
    const isRead = isReadCheckbox.checked;

    const bookId = bookIdMaker();
    const bookData = bookObjectMaker(
      bookId,
      titleInput,
      authorInput,
      yearInput,
      isRead
    );
    books.push(bookData);

    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();

    document.getElementById("form").reset();

    document.getElementById("searchInput").value = "";
  } else {
    alert("Harap isi semua bidang sebelum menambahkan buku.");
  }
}

function bookIdMaker() {
  return +new Date();
}

function bookObjectMaker(id, title, author, year, isRead) {
  return {
    id,
    title,
    author,
    year,
    isRead,
  };
}

function createBookElement(bookObject) {
  const bookTitle = document.createElement("h4");
  bookTitle.innerText = bookObject.title;

  const bookAuthor = document.createElement("p");
  bookAuthor.innerText = `Penulis: ${bookObject.author}`;

  const bookYear = document.createElement("p");
  bookYear.innerText = `Tahun: ${bookObject.year}`;

  const textContainer = document.createElement("div");
  textContainer.classList.add("inner");
  textContainer.append(bookTitle, bookAuthor, bookYear);

  const container = document.createElement("div");
  container.classList.add(
    "p-3",
    "border",
    "mb-3",
    "bg-secondary",
    "bg-opacity-10",
    "rounded"
  );
  container.append(textContainer);
  container.setAttribute("id", `book-${bookObject.id}`);

  if (bookObject.isRead) {
    const undoButton = createButton("Belum Selesai Baca", "secondary", () => {
      undoBookFromCompleted(bookObject.id);
    });

    const trashButton = createButton("Hapus Buku", "danger", () => {
      removeBookFromCompleted(bookObject.id);
    });

    container.append(undoButton, trashButton);
  } else {
    const checkButton = createButton("Selesai Baca", "success", () => {
      addBookToCompleted(bookObject.id);
    });

    const trashButton = createButton("Hapus Buku", "danger", () => {
      removeBookFromCompleted(bookObject.id);
    });

    container.append(checkButton, trashButton);
  }

  return container;
}

function createButton(text, colorClass, onClickCallback) {
  const button = document.createElement("button");
  button.classList.add("btn", "me-2", `btn-${colorClass}`);
  button.innerText = text;
  button.addEventListener("click", () => {
    if (text === "Selesai Baca" || text === "Belum Selesai Baca") {
      onClickCallback();
    } else {
      Swal.fire({
        title: "Hapus Buku",
        text: "Apakah Anda yakin ingin menghapus buku ini?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Ya, Hapus!",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          onClickCallback();
          Swal.fire("Buku Terhapus", "Buku berhasil dihapus.", "success");
        }
      });
    }
  });
  return button;
}

function addBookToCompleted(bookId) {
  const bookIndex = findBookIndex(bookId);

  if (bookIndex === -1) return;

  books[bookIndex].isRead = true;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function findBook(bookId) {
  for (const bookItem of books) {
    if (bookItem.id === bookId) {
      return bookItem;
    }
  }
  return null;
}

function removeBookFromCompleted(bookId) {
  const bookTarget = findBookIndex(bookId);

  if (bookTarget === -1) return;

  books.splice(bookTarget, 1);
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function undoBookFromCompleted(bookId) {
  const bookTarget = findBook(bookId);

  if (bookTarget == null) return;

  bookTarget.isRead = false;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function findBookIndex(bookId) {
  for (const index in books) {
    if (books[index].id === bookId) {
      return index;
    }
  }

  return -1;
}

const SAVED_EVENT = "saved-book";
const STORAGE_KEY = "BOOK_SHELF_APPS";

function isStorageExist() {
  if (typeof Storage === undefined) {
    alert("Browser kamu tidak mendukung local storage");
    return false;
  }
  return true;
}

function saveData() {
  if (isStorageExist()) {
    const parsed = JSON.stringify(books);
    localStorage.setItem(STORAGE_KEY, parsed);
    document.dispatchEvent(new Event(SAVED_EVENT));
  }
}

function loadDataFromStorage() {
  const serializedData = localStorage.getItem(STORAGE_KEY);
  let data = JSON.parse(serializedData);

  if (data !== null) {
    for (const book of data) {
      books.push(book);
    }
  }

  document.dispatchEvent(new Event(RENDER_EVENT));
}

function filterBooks(keyword) {
  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(keyword.toLowerCase())
  );

  document.dispatchEvent(
    new CustomEvent(RENDER_EVENT, { detail: filteredBooks })
  );
}
