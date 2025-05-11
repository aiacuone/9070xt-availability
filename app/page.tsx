import { CentercomData, PcCaseGearData, TransformedData } from '@/types'
import { capitalizeFirstLetter, transformCentercomData, transformPcCasegearData } from '@/utils'
import Image from 'next/image'
import Link from 'next/link'

export default async function Home() {
  const getCentercomData = async () => {
    try {
      const response = await fetch(
        'https://computerparts.centrecom.com.au/api/search?cid=0ae1fd6a074947699fbe46df65ee5714&q=9070xt'
      )

      if (!response.ok) throw new Error('Failed to fetch centercom data')

      const data = await response.json()

      return data.p.sort((a: CentercomData, b: CentercomData) => Number(a.price) - Number(b.price))
    } catch (error) {
      console.log(error)
      return []
    }
  }

  const getPcCasegearData = async () => {
    try {
      const response = await fetch(
        'https://hpd3dbj2io-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(3.35.1)%3B%20Browser%20(lite)&x-algolia-application-id=HPD3DBJ2IO&x-algolia-api-key=9559cf1a6c7521a30ba0832ec6c38499',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [{ indexName: 'pccg_products', params: 'query=9070xt' }],
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to fetch pccasegear data')

      const data = await response.json()

      return data.results[0].hits.sort(
        (a: PcCaseGearData, b: PcCaseGearData) =>
          Number(a.gtmProducts.price) - Number(b.gtmProducts.price)
      )
    } catch (error) {
      console.log(error)
      return []
    }
  }

  const centercomData = transformCentercomData(await getCentercomData())
  const pcCasegearData = transformPcCasegearData(await getPcCasegearData())

  const allData = [...centercomData, ...pcCasegearData].sort(
    (a, b) => Number(a.price) - Number(b.price)
  )

  const priceColor = (price: number) =>
    price < 1300 ? 'bg-green-500/30' : price < 1350 ? 'bg-orange-500/30' : 'bg-red-500/30'

  return (
    <div className="p-10 max-w-screen-2xl m-auto">
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {allData.map(
            ({ imgUrl, isInStock, storeImgUrl, url, ...item }: TransformedData, index) => (
              <div
                key={`${index}-${item.name}`}
                className={`flex flex-col gap-2 p-5 rounded-md ${priceColor(
                  Number(item.price)
                )} bg-opacity-50 ${isInStock ? 'opacity-100' : 'opacity-30'}`}
              >
                <Image src={storeImgUrl} alt={item.name} height={20} width={150} />
                <div className="flex flex-col">
                  {Object.entries(item).map(([key, value]) => {
                    return (
                      <div key={key} className="flex gap-3">
                        <p className="font-bold text-sm">{capitalizeFirstLetter(key)}</p>:
                        <p className="text-sm">{value}</p>
                      </div>
                    )
                  })}
                </div>
                <Image
                  src={imgUrl}
                  alt={item.name}
                  height={200}
                  width={200}
                  className="rounded-md"
                />
                {url && (
                  <Link
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black p-2 rounded-md w-fit px-5 py-1"
                  >
                    Link
                  </Link>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
