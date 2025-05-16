export const transformScorptecData = data => {
  return data.map(item => ({
    ...item,
    storeImgUrl: 'https://www.scorptec.com.au/images/logo.png',
    url: `https://www.scorptec.com.au/product/graphics-cards/radeonrx9070xt/${item.name
      ?.toLowerCase()
      .replace(/\s+/g, '-')}`,
    price: parseFloat(item.price?.replace(/[^0-9.]/g, '')) || 0,
  }))
}
