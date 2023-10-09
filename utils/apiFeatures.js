class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  /** CREATE METHOD FOR EACH OF THE FUNCTIONALITIES */
  filter() {
    const queryObj = { ...this.queryString };

    const excludeFields = ['page', 'sort', 'limit', 'fields'];

    excludeFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // Mongoose cannot filter numeric string => {duration:{$gte: 5}} => This shows CastError
    this.query = this.query.find(JSON.parse(queryStr));

    return this; // => Return the entire object

    // let query = Tour.find(JSON.parse(queryStr));
  }

  sort() {
    /** 2) Sorting */
    if (this.queryString.sort) {
      // console.log(this.queryString.sort);
      const sortBy = this.queryString.sort.split(',').join(' '); // Split the fields into an array
      // console.log(sortBy);
      this.query = this.query.sort(sortBy); // Join the fields with a space to sort by multiple fields
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    // 3) Field Limiting
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      // console.log(fields);
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // -> Here we excluding on this fields if there is no fields select
    }

    return this;
  }

  paginate() {
    // 4) Pagination
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
