export interface TransformedData {
  name: string
  price: number
  imgUrl: string
  url?: string
  isInStock: boolean
  storeImgUrl: string
}

export interface CentercomData {
  productId: number
  name: string
  price: number
  wasPrice: number
  seName: string
  sellingPoint: string
  stockAvailability: 'IN STOCK' | 'INSTORE ONLY'
  stockQuantity: number
  franchiseStock: number
  freeShippingEligible: boolean
  imgUrl: string
  callForPrice: boolean
}

export interface PcCaseGearData {
  products_id: string
  products_sort_order: string
  products_model: string
  is_ETA_TBA: string
  barcode: string
  manufacturers_name: string
  products_name: string
  products_description: string
  Image_URL: string
  Product_URL: string
  products_price: number
  ProductKeywords: string[]
  CategoryKeywords: string[]
  popularity: number
  CategoryID: string
  products_model_suffixes: string[]
  attributes: any[]
  display_price: string
  categories: {
    lvl0: string[]
    lvl1: string[]
  }
  chains: any[][]
  indicator: {
    label: 'In stock' | 'Out of stock'
    color: string
    filter: 'In stock' | 'Out of stock'
  }
  gtmProducts: {
    name: string
    id: number
    price: string
    category: string
    brand: string
    quantity: number
    variant: string
  }
}
