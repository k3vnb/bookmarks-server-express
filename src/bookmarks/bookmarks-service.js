const BookmarksService = {
    getAllBookmarks(knex){
        return knex.select('*').from('bookmarks_list')
    },
    getById(knex, id){
        return knex.select('*').from('bookmarks_list').where('id', id).first()
    },
    insertBookmark(knex, newBookmark){
        return knex.insert(newBookmark).into('bookmarks_list').returning('*').then(rows => rows[0])
    },
    deleteBookmark(knex, id){
        return knex('bookmarks_list').where({ id }).delete()
    },
    updateBookmark(knex, id, newBookmarkFields){
        return knex('bookmarks_list').where({ id }).update(newBookmarkFields)
    }
}

module.exports = BookmarksService