// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

const axios = require('axios')
require('dotenv').config()

// pull in Mongoose model for examples
const Artwork = require('../models/artwork')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { example: { title: '', text: 'foo' } } -> { example: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
const { ObjectID } = require('bson')
const artwork = require('../models/artwork')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /artworks
router.get('/artworks', (req, res, next) => {
	
    Artwork.find()
        .then(async artwork => {
            const artworkImages = await axios(`${process.env.MET_IMAGE_URL}`)
            console.log('this is the data.objectIDs array: ',artworkImages.data.objectIDs)
            const slicedArr = artworkImages.data.objectIDs.slice(20, 50)
            console.log('this is slicedArr: \n', slicedArr)
            slicedArr.map(async objectID => {
                console.log('this is objectID in slicedArr', objectID)
                const artworkObjId = await axios(`${process.env.MET_OBJECTID_URL}/${objectID}`)

                artwork = {
                    "title": artworkObjId.data.title,
                    "artist": artworkObjId.data.artistDisplayName,
                    "department": artworkObjId.data.department,
                    "medium": artworkObjId.data.medium,
                    "img": artworkObjId.data.primaryImage
                }
               
                console.log('the artwork! \n', artwork)
            })
			
		})
		// respond with status 200 and JSON of the examples
		.then((artworks) => res.status(200).json({ artworks: artworks }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

// SHOW
// GET /examples/5a7db6c74d55bc51bdf39793
router.get('/examples/:id', requireToken, (req, res, next) => {
	// req.params.id will be set based on the `:id` in the route
	Example.findById(req.params.id)
		.then(handle404)
		// if `findById` is succesful, respond with 200 and "example" JSON
		.then((example) => res.status(200).json({ example: example.toObject() }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

module.exports = router
