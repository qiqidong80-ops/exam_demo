interface Props {
  title: string
}

export default function PlaceholderPage({ title }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <span className="text-5xl mb-4">🚧</span>
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm mt-1">功能开发中，敬请期待</p>
    </div>
  )
}
