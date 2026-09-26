import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-slate-200',
        className
      )}
    />
  )
}

/** Full weather card skeleton */
export function WeatherCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Skeleton className="w-2.5 h-2.5 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-14 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-16 w-16 rounded-2xl" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-3 space-y-2">
            <Skeleton className="h-4 w-4 mx-auto" />
            <Skeleton className="h-5 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Advisory card skeleton */
export function AdvisoryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-40" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="border border-slate-100 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}
