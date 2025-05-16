'use client'

import { TransformedData } from '@/types'
import { capitalizeFirstLetter } from '@/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [data, setData] = useState<TransformedData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const centercomData = await fetch('/api/centercom')
        .then(res => res.json())
        .catch(err => {
          console.error('Error fetching centercom data:', err)
          return []
        })
      const pcCasegearData = await fetch('/api/pccasegear')
        .then(res => res.json())
        .catch(err => {
          console.error('Error fetching pcCasegear data:', err)
          return []
        })
      const scorptecData = await fetch('/.netlify/functions/scorptec')
        .then(res => res.json())
        .catch(err => {
          console.error('Error fetching scorptec data:', err)
          return []
        })

      const sortedData = [...centercomData, ...pcCasegearData, ...scorptecData].sort(
        (a, b) => a.price - b.price
      )

      setData(sortedData)
      setLoading(false)
    }
    fetchData()
  }, [])

  const priceColor = (price: number) =>
    price < 1300 ? 'bg-green-500/30' : price < 1350 ? 'bg-orange-500/30' : 'bg-red-500/30'

  return (
    <div className="p-10 max-w-screen-2xl m-auto">
      {loading && <div className="flex justify-center items-center h-screen">Loading...</div>}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {data.map(({ imgUrl, isInStock, storeImgUrl, url, ...item }: TransformedData, index) => (
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
              <Image src={imgUrl} alt={item.name} height={200} width={200} className="rounded-md" />
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
          ))}
        </div>
      </div>
    </div>
  )
}
