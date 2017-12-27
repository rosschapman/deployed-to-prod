const db = require('../data/db');

module.exports = {
	errors: [],
	prepareSave(collectionName) {
		return sanitize(this.data);
	},
	sanitize(data) {
		let sanitized = {};
		for (const key in data) {
			// Kill the $ mongo exploit
			// More here: https://blog.websecurify.com/2014/08/hacking-nodejs-and-mongodb.html
			if (/^\$/.test(key)) {
				console.log(`Leslie NOPE, this key:${key} is dangerous`)
				delete data[key];
			} 
			sanitized[key] = data[key];
		}

		return sanitized;
	},
	isValid() {
		const data = this.data;
		const validations = this.validations;

		Object.keys(validations).forEach((key)=> {
			if (!validations[key].isRequired) {
				return;
			}

			const dataConstructorName = data[key].constructor.name;
			// Less confusing control flow possiblyyyy, oh man starts to get a little // rambuncious when I start gating the different types below
			if (data[key] === undefined && validations[key].isRequired === true) {
				return this.addError({prop: key, message: `{key} can't be blank`});
			} else if (data[key] === undefined) {
				return;
			}
			
			if (
				dataConstructorName === 'String' && 
				dataConstructorName !== validations[key].type.name
			) {
				this.addError({prop: key, message: 'Invalid type, must be string'});
			}

			if (
				dataConstructorName === 'Object' && 
				dataConstructorName !== validations[key].constructor.name
			) {
				this.addError({prop: key, message: 'Invalid type, must be object'});
			}

			if (
				dataConstructorName === 'Date' && 
				dataConstructorName !== validations[key].type.name
			) {
				this.addError({prop: key, message: 'Invalid type, must be a date'});
			}
		});

		return this.errors.length === 0;
	},
	addError(error) {
		this.errors.push(error);
	},

	// Persistence-related code on the model like they do in Rails and Ember,
	// kinda smooshing domain and data model together which is totally cool with
	// me for this app at it's current size an scope.
	save() {
		const coll = db.getDb().collection(this.collectionName);
		const docTitle = this.data.title;
		const doctFinishedAtDate = this.data.finishedAt;
		
		// Consider using an index to force uniqueness
    return coll.update({ 
			title: docTitle }, 
			{
				$set: {
					'finishedAt': doctFinishedAtDate
				}
			}
		);
  },
  destroy() {
    const coll = db.getDb().collection(this.collectionName);
    return coll.deleteOne(this.data);
	},
}