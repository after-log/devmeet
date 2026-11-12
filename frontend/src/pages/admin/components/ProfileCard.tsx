import { ArrowRight, Image } from 'lucide-react';
import type { Member } from '../mock';
import { Badge } from './AdminUI';

export default function ProfileCard({
  member,
  onReview,
}: {
  member: Member;
  onReview: (member: Member) => void;
}) {
  return (
    <article className="overflow-hidden rounded-[10px] border border-[#e5e5e5] bg-white">
      <button
        className="group relative block h-[220px] w-full overflow-hidden border-0 bg-[#f5f5f5] p-0 max-sm:h-[190px] min-[1550px]:h-[270px]"
        onClick={() => onReview(member)}
      >
        <img
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.035] motion-reduce:transition-none"
          src={member.photos[0]}
          alt={`${member.name} 프로필`}
        />
        <span className="absolute right-[11px] bottom-[11px] flex items-center gap-1 rounded bg-[#2626268c] px-[7px] py-0.5 text-[10px] text-white backdrop-blur-sm">
          <Image size={13} /> {member.photos.length}
        </span>
        <span className="absolute top-3 left-3">
          <Badge status={member.review} />
        </span>
      </button>
      <div className="p-[15px] max-sm:p-[11px]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {member.name}
            <small className="ml-[7px] text-[11px] font-normal text-[#a3a3a3]">
              {member.age}세
            </small>
          </h3>
          <span className="text-[9px] text-[#a3a3a3] max-sm:hidden">{member.id}</span>
        </div>
        <p className="mt-[5px]! mb-4! text-[10px] whitespace-nowrap text-[#a3a3a3] max-sm:mb-2! max-sm:min-h-7 max-sm:text-[9px] max-sm:whitespace-normal">
          {member.role} · {member.region}
        </p>
        <footer className="flex justify-between gap-[5px] border-t border-[#f5f5f5] pt-3 max-sm:block max-sm:pt-2">
          <small className="text-[9px] text-[#a3a3a3]">등록 {member.joined}</small>
          <button
            className="flex items-center gap-[3px] border-0 bg-transparent p-0 text-[10px] text-[#404040] max-sm:mt-1.5"
            onClick={() => onReview(member)}
          >
            프로필 확인 <ArrowRight size={14} />
          </button>
        </footer>
      </div>
    </article>
  );
}
