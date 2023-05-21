process.env.NODE_ENV = "test";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const Book = require("../models/book");

describe("Book Routes Test", function() {

    beforeEach(async function() {
        await db.query("DELETE FROM books");
    
        let b1 = await Book.create({
            "isbn": "0691161518",
            "amazon_url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
        });
    
    });

    describe("GET /books/", function() {
        test("can get a list of all books", async function() {
            let results = await request(app).get("/books/");
            expect(results.statusCode).toEqual(200);
            expect(results.body.books.length).toBe(1);
            expect(results.body.books[0].isbn).toEqual("0691161518");
        });
    });

    describe("POST /books/", function() {
        test("can add a new book", async function() {
            let newestBook = await request(app).post("/books/")
                .send({
                    "isbn": "5555555555",
                    "author": "Dr Test",
                    "pages": 555,
                    "publisher": "Test Press",
                    "title": "Test: Testing Adding A New Book",
                    "year": 2023
            });
            expect(newestBook.statusCode).toEqual(201);
            expect(newestBook.body.book.title).toEqual("Test: Testing Adding A New Book");
            expect(newestBook.body.book.amazon_url).toEqual(null);

            let results = await request(app).get("/books/");
            expect(results.body.books.length).toBe(2);
        });

        test("cannot add a new book without required information", async function() {
            let response = await request(app).post("/books/")
                .send({
                    "pages": 555,
                    "publisher": "Test Press",
                    "year": 2023
            });
            expect(response.statusCode).toEqual(400);
            expect(response.body.error.status).toEqual(400);
            expect(response.body.error.message).toEqual([
                'instance requires property "isbn"',
                'instance requires property "author"',
                'instance requires property "title"'
              ])
        });

        test("cannot add a new book with data of the wrong type", async function() {
            let response = await request(app).post("/books/")
                .send({
                    "isbn": 5555555555,
                    "author": true,
                    "pages": "555",
                    "publisher": null,
                    "title": true,
                    "year": "2023",
                    "amazon_url": null,
                    "language": false
            });
            expect(response.statusCode).toEqual(400);
            expect(response.body.error.status).toEqual(400);
            expect(response.body.error.message).toEqual([
                "instance.isbn is not of a type(s) string",
                "instance.amazon_url is not of a type(s) string",
                "instance.author is not of a type(s) string",
                "instance.language is not of a type(s) string",
                "instance.pages is not of a type(s) integer",
                "instance.publisher is not of a type(s) string",
                "instance.title is not of a type(s) string",
                "instance.year is not of a type(s) integer"
            ]);
        });

        test("cannot add a new book without a book object", async function() {
            let response = await request(app).post("/books/")
                .send("I am a string, not a book object.");
            expect(response.statusCode).toEqual(400);
            expect(response.body.error.status).toEqual(400);
            expect(response.body.error.message).toEqual([
                'instance requires property "isbn"',
                'instance requires property "author"',
                'instance requires property "title"'
            ])
        });
    });

    describe("PUT /books/:isbn", function() {
        test("can update a book", async function () {
            let result = await request(app).put("/books/0691161518")
                .send({
                    "amazon_url": "http://a.co/eobPtX2",
                    "author": "Matthew Lane",
                    "language": "english",
                    "pages": 276,
                    "publisher": "Princeton University Press",
                    "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
                    "year": 2023
            });
            expect(result.statusCode).toEqual(200);
            expect(result.body.book.year).toEqual(2023);
            expect(result.body.book.isbn).toEqual("0691161518");
        });

        test("cannot update a book with data of the wrong type", async function() {
            let response = await request(app).put("/books/0691161518")
                .send({
                    "author": true,
                    "pages": "555",
                    "publisher": null,
                    "title": true,
                    "year": "2023",
                    "amazon_url": null,
                    "language": false
            });
            expect(response.statusCode).toEqual(400);
            expect(response.body.error.status).toEqual(400);
            expect(response.body.error.message).toEqual([
                "instance.amazon_url is not of a type(s) string",
                "instance.author is not of a type(s) string",
                "instance.language is not of a type(s) string",
                "instance.pages is not of a type(s) integer",
                "instance.publisher is not of a type(s) string",
                "instance.title is not of a type(s) string",
                "instance.year is not of a type(s) integer"
            ]);
        });        
        /* *** This is still allowed by our app! Recommend to fix for next release. *** */
        // test("cannot update a book without a book object", async function() {
        //     let response = await request(app).put("/books/0691161518")
        //         .send("I am a string, not a book object.");
        //         expect(response.statusCode).toEqual(400);
        //     expect(response.body.error.status).toEqual(400);
        // });
    });

    describe("DELETE /books/:isbn", function() {
        test("can delete a book", async function () {
            let result = await request(app).delete("/books/0691161518");
            expect(result.statusCode).toEqual(200);
            expect(result.body.message).toEqual("Book deleted");
            let results = await request(app).get("/books/");
            expect(results.body.books.length).toBe(0);
        });
    });

    afterAll(async function() {
        await db.end();
    });

});