const db = require('../lib/db');

const BaseModel = {
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
		});

		return this.errors.length === 0;
	},
	addError(error) {
		this.errors.push(error);
	},
	save(successCallback, errorCallback) {
		const coll = db.getDb().collection(this.collectionName);
		// Consider using an index to force uniqueness
  		coll.update(
			{ title: this.data.title }, 
			this.data, 
			{ upsert: true }
		).then((result) => {
			// Hmmm: not sure why but result.hasWriteError() isn't working
			if (result.writeErrors) { 
				console.log(err); 
				res.write(err);
				res.end();
			} else {
				successCallback(result);
				res.writeHead(201);
				res.write(`Success yo! ${result}`)
				res.end();
			}
  	});
	}
}

module.exports = BaseModel;