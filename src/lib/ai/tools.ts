import { Type } from '@google/genai';

export const toolsDefinition = [
  {
    functionDeclarations: [
      {
        name: 'addToCart',
        description: 'Adds specified rice variety and weight to the user cart.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            riceType: {
              type: Type.STRING,
              enum: ['Devzira', 'Lazer', 'Alanga', 'Ushoq'],
              description: 'Rice variety name.',
            },
            weightKg: {
              type: Type.NUMBER,
              description: 'Weight in kilograms to add to cart.',
            },
          },
          required: ['riceType', 'weightKg'],
        },
      },
      {
        name: 'calculateShipping',
        description: 'Calculates delivery option based on weight rules: 1-69kg via Damas Micro-Transit, 70-1000kg via Labo Batch Delivery.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            zone: {
              type: Type.STRING,
              enum: ['Zarkent', "So'qoq", 'Kumushkon', 'Hisarak', 'Yangibozor', 'Parkent Center'],
              description: 'Delivery zone name.',
            },
            weightKg: {
              type: Type.NUMBER,
              description: 'Total order weight in kilograms.',
            },
          },
          required: ['zone', 'weightKg'],
        },
      },
      {
        name: 'openCart',
        description: 'Opens the shopping cart modal for the user.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
          required: [],
        },
      },
    ],
  },
];

