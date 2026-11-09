import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Healthcare Platform API',
    version: '1.0.0',
    description: 'API documentation for the Healthcare AI Platform.'
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts'], // Adjust path to match your project
};

export const swaggerSpec = swaggerJSDoc(options);
