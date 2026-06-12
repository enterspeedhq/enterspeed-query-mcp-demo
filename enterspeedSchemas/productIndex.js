/** @type {Enterspeed.IndexSchema} */
  export default {
  triggers: function(context) {
    // A trigger that triggers on your source entity type(s) in your source group
    // See documentation for triggers here: https://docs.enterspeed.com/reference/js/index-schema/triggers
    context.triggers('pim', ['product'])
  },
  index: {
    // All fields that should be indexed in the search index
    // See documentation for index here: https://docs.enterspeed.com/reference/js/index-schema/indexMethod
    fields: {
      // Example of a searchable field with type keyword
      name: { type: "keyword" },
      category: { type: "keyword" },
      brand: { type: "keyword" },
      sku: { type: "keyword" },
      price: { type: "float" },
      marginPercent: { type: "integer" },
      inStock: { type: "boolean" },
      stockQty: { type: "integer" },
      rating: { type: "float" },
      reviewCount: { type: "integer" },
      tags: { type: "keyword[]" },
    }
  },
  properties: function (sourceEntity) {
    // Example that returns all properties from the source entity to the view
    // See documentation for properties here: https://docs.enterspeed.com/reference/js/index-schema/properties
    return {
      name: sourceEntity.properties.name,
      category: sourceEntity.properties.category,
      brand: sourceEntity.properties.brand,
      sku: sourceEntity.properties.sku,
      price: sourceEntity.properties.price,
      marginPercent: sourceEntity.properties.marginPercent,
      inStock: sourceEntity.properties.inStock,
      stockQty: sourceEntity.properties.stockQty,
      rating: sourceEntity.properties.rating,
      reviewCount: sourceEntity.properties.reviewCount,
      tags: sourceEntity.properties.tags,
    }
  }
}