import Link from 'next/link'

export function CreateNestButton() {
  return (
    <Link href='/n/new'>
      <div className='p-2 bg-yellow-50'>
        Create Nests
      </div>
    </Link>
  )
}
