jest.mock('../../src/middlewares/auth/authentication');

const request = require('supertest');
const { createExpressApp } = require('../../src/server');

const {
  search,
  create,
  deleteById,
} = require('../../src/domains/product/service');

const Product = require('../../src/domains/product/schema');

let app = null;
let agent = null;

beforeAll(async () => {
  app = createExpressApp();
  const mockUser = { id: 123, email: 'test@example.com', isAdmin: false };
  agent = request.agent(app).set('x-mock-user', JSON.stringify(mockUser));
});
afterAll(async () => {
  app = null;
});

// beforeEach(async () => console.log('1 - beforeEach'));
// afterEach(async () => console.log('1 - afterEach'));

// Test App module
// Test API up and running
describe('Domains.Products', () => {
  describe('API', () => {
    // clean up
    afterAll(async () => {
      // delete all products
      await Product.deleteMany({});
    });

    // GET /api/v1/products
    describe('GET /api/v1/products', () => {
      it('should return status 200 and a JSON response', async () => {
        const response = await agent.get('/api/v1/products');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
      });
    });

    // POST /api/v1/products
    describe('POST /api/v1/products', () => {
      it('should return status 201 and a JSON response', async () => {
        const response = await agent.post('/api/v1/products').send({
          name: 'Sample Product',
          description: 'This is a sample product for demonstration purposes.',
          price: 19,
          inStock: true,
        });

        expect(response.status).toBe(201);
        expect(response.body._id).not.toBeNull();

        // fetch product from database
        const productResponse = await agent.get(
          `/api/v1/products/${response.body._id}`
        );
        expect(productResponse.status).toBe(200);
        expect(productResponse.body).toEqual(response.body);
      });

      it('should return status 400 if the request body is invalid', async () => {
        const response = await agent.post('/api/v1/products').send({
          name: 'Product without price',
        });
        expect(response.status).toBe(400);
      });
    });

    // GET /api/v1/products/:id
    describe('GET /api/v1/products/:id', () => {
      it('should return status 400 when id is not valid', async () => {
        const response = await agent.get('/api/v1/products/123');
        expect(response.status).toBe(400);
      });

      it('should return status 400 if the request params is invalid', async () => {
        const response = await agent.get('/api/v1/products/invalid-id');
        expect(response.status).toBe(400);
      });
      //id = 66123283c07ca0e7dcc37990
      it('should return status 404 if the product is not found', async () => {
        const response = await agent.get(
          '/api/v1/products/66123283c07ca0e7dcc37990'
        );
        expect(response.status).toBe(404);
      });
    });

    // PUT /api/v1/products/:id
    describe('PUT /api/v1/products/:id', () => {
      it('should return status 400 when id is not valid', async () => {
        const response = await agent.put('/api/v1/products/123');
        expect(response.status).toBe(400);
      });

      it('should return status 400 if the request params is invalid', async () => {
        const response = await agent.put('/api/v1/products/invalid-id');
        expect(response.status).toBe(400);
      });

      it('should return status 404 if the product is not found', async () => {
        const response = await agent.put(
          '/api/v1/products/66123283c07ca0e7dcc37990'
        );
        expect(response.status).toBe(404);
      });

      it('should return status 400 if the request body is invalid', async () => {
        const response = await agent
          .put('/api/v1/products/66123283c07ca0e7dcc37990')
          .send({
            _id: '66123283c07ca0e7dcc37990',
            name: 'Product without price',
          });
        expect(response.status).toBe(400);
      });

      // create and then update the product and then assert the response
      it('should return status 200 and a JSON response', async () => {
        const createResponse = await agent.post('/api/v1/products').send({
          name: 'Sample Product',
          description: 'This is a sample product for demonstration purposes.',
          price: 19,
          inStock: true,
        });

        const updateResponse = await agent
          .put(`/api/v1/products/${createResponse.body._id}`)
          .send({
            name: 'Updated Product',
            description:
              'This is an updated product for demonstration purposes.',
            price: 29,
            inStock: false,
          });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body._id).toBe(createResponse.body._id);
        expect(updateResponse.body.name).toBe('Updated Product');
        expect(updateResponse.body.price).toBe(29);
        expect(updateResponse.body.inStock).toBe(false);

        // fetch product from database via GET /products/:id
        const productResponse = await agent.get(
          `/api/v1/products/${createResponse.body._id}`
        );
        expect(productResponse.status).toBe(200);
        expect(productResponse.body).toEqual(updateResponse.body);
      });
    });

    // DELETE /api/v1/products/:id authorization test
    describe('DELETE /api/v1/products/:id authorization', () => {
      it('should return status 403 when user is not an admin', async () => {
        const normalUser = {
          id: 123,
          email: 'test@example.com',
          isAdmin: false,
        };
        agent = agent.set('x-mock-user', JSON.stringify(normalUser));
        const response = await agent.delete('/api/v1/products/123');
        expect(response.status).toBe(403);
      });
    });

    // DELETE /api/v1/products/:id
    describe('DELETE /api/v1/products/:id', () => {
      beforeAll(async () => {
        const adminUser = { id: 123, email: 'test@example.com', isAdmin: true };
        agent = agent.set('x-mock-user', JSON.stringify(adminUser));
      });

      it('should return status 400 when id is not valid', async () => {
        const response = await agent.delete('/api/v1/products/123');
        expect(response.status).toBe(400);
      });

      it('should return status 400 if the request params is invalid', async () => {
        const response = await agent.delete('/api/v1/products/invalid-id');
        expect(response.status).toBe(400);
      });

      it('should return status 204 if the product is successfully deleted', async () => {
        const createResponse = await agent.post('/api/v1/products').send({
          name: 'Sample Product',
          description: 'This is a sample product for demonstration purposes.',
          price: 19,
          inStock: true,
        });

        const deleteResponse = await agent.delete(
          `/api/v1/products/${createResponse.body._id}`
        );
        expect(deleteResponse.status).toBe(204);

        // fetch product from database via GET /products/:id
        const productResponse = await agent.get(
          `/api/v1/products/${createResponse.body._id}`
        );
        expect(productResponse.status).toBe(404);
      });
    });
  });

  describe('Service', () => {
    // setup products
    const products = [
      {
        name: 'Product 1',
        description: 'Product 1 description',
        price: 10,
        inStock: true,
      },
      {
        name: 'Product 2',
        description: 'Product 2 description',
        price: 20,
        inStock: true,
      },
      {
        name: 'Product 3',
        description: 'Product 3 description',
        price: 30,
        inStock: false,
      },
    ];
    const productIds = [];

    // create products and store the ids in an array
    beforeAll(async () => {
      for (const product of products) {
        const createdProduct = await create(product);
        productIds.push(createdProduct._id);
      }
    });

    // clean up
    afterAll(async () => {
      for (const id of productIds) {
        await deleteById(id);
      }
    });

    // search returns all products when no keyword filter is provided
    it('should return all products when no keyword filter is provided', async () => {
      const result = await search();
      expect(result.length).toBe(products.length);
    });
    // search filters products by keyword in the name field (case-insensitive)
    it('should filter products by keyword in the name field (case-insensitive)', async () => {
      const result = await search({ keyword: 'product 1' });
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Product 1');
    });
    // search filters products by keyword in the description field (case-insensitive)
    it('should filter products by keyword in the description field (case-insensitive)', async () => {
      const result = await search({ keyword: 'description' });
      expect(result.length).toBe(products.length);
    });
    // search filters products with keywords matching both name and description fields
    it('should filter products with keywords matching both name and description fields', async () => {
      const result = await search({ keyword: 'product 3 description' });
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Product 3');
    });
  });
});
