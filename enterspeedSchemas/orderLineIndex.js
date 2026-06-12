/** @type {Enterspeed.IndexSchema} */
  export default {
  triggers: function(context) {
    // A trigger that triggers on your source entity type(s) in your source group
    // See documentation for triggers here: https://docs.enterspeed.com/reference/js/index-schema/triggers
    context.triggers('erp', ['orderLine'])
  },
  index: {
    // All fields that should be indexed in the search index
    // See documentation for index here: https://docs.enterspeed.com/reference/js/index-schema/indexMethod
    fields: {
      // Example of a searchable field with type keyword
      lineId: { type: "keyword" },
      orderId: { type: "keyword" },
      productId: { type: "keyword" },
      sku: { type: "keyword" },
      name: { type: "keyword" },
      category: { type: "keyword" },
      qty: { type: "integer" },
      unitPrice: { type: "float" },
      lineTotal: { type: "float" },
    }
  },
  properties: function (sourceEntity) {
    // Example that returns all properties from the source entity to the view
    // See documentation for properties here: https://docs.enterspeed.com/reference/js/index-schema/properties
    return {
      lineId: sourceEntity.properties.lineId,
      orderId: sourceEntity.properties.orderId,
      productId: sourceEntity.properties.productId,
      sku: sourceEntity.properties.sku,
      name: sourceEntity.properties.name,
      category: sourceEntity.properties.category,
      qty: sourceEntity.properties.qty,
      unitPrice: sourceEntity.properties.unitPrice,
      lineTotal: sourceEntity.properties.lineTotal,
    }
  }
}