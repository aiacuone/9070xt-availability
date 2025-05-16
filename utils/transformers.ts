import { CentercomData, PcCaseGearData, ScorptecData, TransformedData } from '@/types/api'

export const transformPcCasegearData = (data: PcCaseGearData[]): TransformedData[] =>
  data.map(item => ({
    name: item.products_name,
    price: item.products_price,
    imgUrl: item.Image_URL,
    url: `https://www.pccasegear.com/${item.Product_URL}`,
    isInStock: item.indicator.label === 'In stock',
    storeImgUrl:
      'https://www.pccasegear.com/includes/templates/pccg2020/assets/images/logo-pc-case-gear-dark.svg',
  }))

export const transformCentercomData = (data: CentercomData[]): TransformedData[] =>
  data.map(item => ({
    name: item.name,
    price: item.price,
    imgUrl: item.imgUrl,
    isInStock: item.stockAvailability === 'IN STOCK',
    storeImgUrl: 'https://www.centrecom.com.au/Content/Images/cc-logo.svg',
  }))

export const transformScorptecData = (data: ScorptecData[]): TransformedData[] =>
  data.map(item => ({
    name: item.name,
    price: item.price,
    imgUrl: item.imgUrl,
    isInStock: item.isInStock,
    storeImgUrl: '/scorptec-logo.svg',
  }))
