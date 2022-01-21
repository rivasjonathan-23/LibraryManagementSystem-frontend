$(document).ready(function () {
    let books = []
    let bookObj = {}
    let selectedBooks = []
    let records = []
    let update = false
    let viewedRecord = {}
    const url = "http://localhost:3000"

    fetch(`${url}/getRecords`)
        .then(res => res.json())
        .then(res => {
            records = res.reverse()
            populateTable(records)
        })

    fetch(`${url}/getBooks`)
        .then(res => res.json())
        .then(res => {
            res.forEach(b => {
                bookObj[b._id + ""] = b
            })
            console.log(bookObj);
            books = res
        })

    $(".record").on("mouseover", "tr", function () {
        $(this).find(".actionsColumn button").css({ "opacity": 1 })
    })

    $(".record").on("click", "#delete", function (e) {
        e.stopPropagation()
        let text = "Are you sure you want to delete this record?";
        if (confirm(text) == true) {
            const parent = $(this).parent().parent()
            fetch(`${url}/deleteRecord/${parent.attr("data-record-id")}`,
                {
                    method: "DELETE",

                }).then(_ => {
                    parent.remove()
                })
        }

    })

    $(".record").on("click", "#update", function (e) {
        e.stopPropagation()
        viewedRecord = records.filter(r => r._id == $(this).parent().parent().attr("data-record-id"))[0]
        viewRecord()
    })

    $(".record").on("mouseleave", "tr", function () {
        $(this).find(".actionsColumn button").css({ "opacity": .4 })
    })

    $(".record").on("click", "tr", function () {
        viewedRecord = records.filter(r => r._id == $(this).attr("data-record-id"))[0]
        viewRecord()
    })


    $(".createRecordBtn").click(function () {
        showModal()
    })

    $("#search").keyup(function () {
        let bookTitle = $(this).val().toLowerCase()
        const filteredBooks = books.filter(book => book.title.toLowerCase().includes(bookTitle))
        displayBooks(filteredBooks)
    })

    $("#form").submit(function (e) {
        e.preventDefault()
        if (selectedBooks.length == 0 && !update) {
            return
        }
        var values = { borrowedBooks: selectedBooks };
        $.each($('#form').serializeArray(), function (i, field) {
            values[field.name] = field.value;
        });

        let url = `${url}/createRecord`
        if (update) url = `${url}/updateRecord/${viewedRecord._id}`

        fetch(url,
            {
                method: "POST",
                body: JSON.stringify(values),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            }).then(res => res.json())
            .then(res => {
                const msg = update ? " updated" : " created"
                alert(`Record successfully ${msg}.`)

                if (update) {
                    res.borrowedBooks = res.borrowedBooks.map(b => bookObj[b])
                    let newRecords = records.map(r => {
                        if (r._id == res._id) {
                            return res
                        }
                        return r
                    })

                    populateTable(newRecords)
                    hideModal()

                } else {
                    hideModal()
                    res.borrowedBooks = res.borrowedBooks.map(b => bookObj[b])
                    records.unshift(res)
                    let record = res
                    let date = new Date(record.createdAt)
                    let borrowedDate = date.toLocaleDateString() + " - " + date.toLocaleTimeString()
                    let date2 = new Date(record.returnDate)
                    let returnDate = date2.toLocaleDateString() + " - " + date.toLocaleTimeString()
                    let borrowedBooks = record.borrowedBooks.map(b => `<li>${b.title}</li>`)
                    $(`<tr data-record-id="${record._id}">
                    <td>${record.borrowerName}</td>
                    <td>
                        <ul>
                            ${borrowedBooks.join("")}
                        </ul>
                    </td>
                    <td>${borrowedDate}</td>
                    <td>${returnDate}</td>
                    <td class="actionsColumn">
                        <button id="update" class="greenBg">Update</button>
                        <button class="redBg">Delete</button>
                    </td>
                </tr>`).insertAfter(".recordHeader")
                }
                console.log(res)
            })
            .catch(error => {
                console.log(error)
                alert("Unexpected Error Occured!")
            })
    })

    const selectedIndicator = `<div class="selected">Selected</div>`


    $("#next").click(function () {
        $("#bookSelection").hide()
        $("#enterBorrower").show()
        let bSelected = books.filter(b => selectedBooks.includes(b._id))
        showSelectedBooks(bSelected)
    })


    $("div").on("click", ".bookBox", function () {
        const id = $(this).attr("data-id")
        if (selectedBooks.includes(id)) {
            $(this).find(".selected").hide()
            selectedBooks = selectedBooks.filter(bookId => bookId != id)
        } else {
            selectedBooks.push(id)
            $(this).find(".selected").show()
            $(this).find(".selected").show()
        }
    })

    $(".formWrapper").click(function (e) {
        e.stopPropagation()
    })

    $("#selectOtherBooks").click(function () {
        $("#bookSelection").show()
        $("#enterBorrower").hide()
    })

    $(".modalOverlay").click(function () {
        hideModal()
    })

    $(".cancelCreation").click(function () {
        hideModal()
    })

    function hideModal() {
        $("#enterBorrower").hide()
        $(".modalOverlay").fadeOut()
        $(".formWrapper").hide()
        selectedBooks = []
        $("#bookSelection").show()
        $(".selectedBooks").html("")
        $('input[name=borrowerName]').val("");
        $('input[name=borrowerAddress]').val("");
        $('input[name=borrowerIdNumber]').val("");
        update = false
    }

    function showModal() {
        $(".modalOverlay").fadeIn()
        setTimeout(() => {
            $(".formWrapper").slideDown()
            displayBooks(books)
        }, 300);
    }

    function viewRecord() {
        showModal()
        update = true
        $("#bookSelection").hide()
        $("#enterBorrower").show()
        $('input[name=borrowerName]').val(viewedRecord.borrowerName);
        $('input[name=borrowerAddress]').val(viewedRecord.borrowerAddress);
        $('input[name=borrowerIdNumber]').val(viewedRecord.borrowerIdNumber);
        selectedBooks = viewedRecord.borrowedBooks.map(b => b._id)
        showSelectedBooks(viewedRecord.borrowedBooks)
    }


    function showSelectedBooks(selected) {
        let booksSelected = ""

        selected.forEach(book => {
            booksSelected += `<div class="book">
                        <div class="bookCover"></div>
                        <div class="bookDescription">
                            <h4 id="booktitle">${book.title}</h4>
                            <p id="bookAuthor">${book.author}</p>
                            <p id="bookISBN">${book.ISBN}</p>
                         </div>
                    </div>`
        })
        $(".selectedBooks").html(booksSelected)
    }


    function displayBooks(books) {
        let newBooks = ``
        books.forEach(book => {
            console.log(book.title)
            newBooks += `<div class="bookBox" data-id="${book._id}">
                    ${selectedBooks.includes(book._id) ? selectedIndicator : ""}
                    <div class="selected" style="display: none">Selected</div>
                    <div class="bImage"></div>
                    <p class="bTitle">${book.title}</p>
                    <p class="bAuthor">${book.author}</p>
                </div>`
        })
        $(".listOfBooks").html(newBooks)
    }

    function populateTable(records) {
        console.log("records: ", records)
        let list = ""
        let head = ` <tr class="recordHeader">
                        <th>Borrower</th>
                        <th>Books</th>
                        <th>Date Borrowed</th>
                        <th colspan="2">Return Date</th>
                    </tr>`
        records.forEach(record => {
            let date = new Date(record.createdAt)
            let borrowedDate = date.toLocaleDateString() + " - " + date.toLocaleTimeString()
            let date2 = new Date(record.returnDate)
            let returnDate = date2.toLocaleDateString() + " - " + date.toLocaleTimeString()
            let borrowedBooks = record.borrowedBooks.map(b => `<li>${b.title}</li>`)
            list += `
                    <tr data-record-id="${record._id}">
                        <td>${record.borrowerName}</td>
                        <td>
                            <ul>
                                ${borrowedBooks.join("")}
                            </ul>
                        </td>
                        <td>${borrowedDate}</td>
                        <td>${returnDate}</td>
                        <td class="actionsColumn">
                            <button id="update" class="greenBg">Update</button>
                            <button id="delete" class="redBg">Delete</button>
                        </td>
                    </tr>
                `
        })
        $(".record").html(head + list)
    }
})
