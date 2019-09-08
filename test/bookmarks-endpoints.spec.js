const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures.js')

describe.only('Bookmarks Endpoints', function() {
    let db
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })
    after('disconnect from db', () => db.destroy())
    before('clean the table', () => db('bookmarks_list').truncate())
    afterEach('cleanup', () => db('bookmarks_list').truncate())

    describe('GET /bookmarks', () => {
        context('Given no bookmarks in the db', () => {
            it('responds with 200 and an empty list', () => {
              return supertest(app)
                .get('/bookmarks')
                .expect(200, [])
            })
        })
        context('Given there are bookmarks in the db', () => {
          const testBookmarks = makeBookmarksArray()
          beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks_list')
                .insert(testBookmarks)
          })
          it('GET /bookmarks returns 200 and a list of bookmarks', () => {
            return supertest(app)
                .get('/bookmarks')
                .expect(200, testBookmarks) 
          })
        })
    })

    describe('POST /bookmarks', () => {
      const newBookmark = {
        title: "Test new title",
        url: "https://test123.dev",
        description: "test new descriptions",
        rating: 4,
      }
      it('creates a bookmark, responds with 201 and the new bookmark', function() {
        return supertest(app)
          .post('/bookmarks')
          .send(newBookmark)
          .expect(201)
          .expect(res => {
            const { title, description, url, rating } = res.body
            expect(title).to.eql(newBookmark.title)
            expect(description).to.eql(newBookmark.description)
            expect(url).to.eql(newBookmark.url)
            expect(rating).to.eql(newBookmark.rating)
            expect(res.body).to.have.property('id')
            expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
          })
          .then(postRes => 
              supertest(app)
                .get(`/bookmarks/${postRes.body.id}`)
                .expect(postRes.body)
            )
      })
      const requiredFields = ['title', 'url', 'rating']
      requiredFields.forEach(field => {
        it(`returns 400 with an error message if post request does not include ${field}`, () => {
            const testBookmark = {...newBookmark}
            delete testBookmark[field]

            return supertest(app)
              .post('/bookmarks')
              .send(testBookmark)
              .expect(400, 'Invalid data')
          })
      })

      const invalidRatingsEntries = [0, 6, -1000, 1000, 'hello', {hi: "there"}, []]
      invalidRatingsEntries.forEach(entry => {
        it(`returns 400 with an error message if the req.body.rating is not an integer in the range of 1 and 5`, () => {
            const testBookmark = {...newBookmark, rating: entry}

            return supertest(app)
              .post('/bookmarks')
              .send(testBookmark)
              .expect(400, 'Invalid data')
          })
      })
      const invalidUrlEntries = ['hi', 12, [], {hello: 'world'}, 'http://sweet']
      invalidUrlEntries.forEach(entry => {
        it(`returns 400 with an error message if the req.body.url is not a valid URL string`, () => {
          const testBookmark = {...newBookmark, url: entry}
          return supertest(app)
            .post('/bookmarks')
            .send(testBookmark)
            .expect(400, 'Invalid data')
        })
      })
    })

    describe('GET /bookmarks/:id', () => {
      context('Given no bookmarks', () => {
        it('responds with 404', () => {
          const bookmarkId = 3
          return supertest(app)
            .get(`/bookmarks/${bookmarkId}`)
            .expect(404)
        })
      })
      context('Given there are bookmarks in the db', () => {
        const testBookmarks = makeBookmarksArray()
        beforeEach('insert data into db', () => {
          return db.into('bookmarks_list').insert(testBookmarks)
        })
        it('responds with 200 and specified bookmark', () => {
            const bookmarkId = 2
            const expectedBookmark = testBookmarks[bookmarkId - 1]
            return supertest(app)
                .get(`/bookmarks/${bookmarkId}`)
                .expect(200, expectedBookmark)
        })
      })
    })
})