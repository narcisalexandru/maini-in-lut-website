import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ArtistStatus } from '../../common/enums/artist-status.enum';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Artist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  displayName: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  artistFirstName: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  artistLastName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  companyCui: string | null;

  @Column({ type: 'text', nullable: true })
  companyLegalName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  contactPhone: string | null;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  portfolioUrl: string | null;

  @Column({ type: 'text', nullable: true })
  logo: string | null;

  @Column({ type: 'text', nullable: true })
  coverImage: string | null;

  @Column({ type: 'int', nullable: true, unique: true })
  userId: number | null;

  @OneToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ default: false })
  isPlatform: boolean;

  @Column({
    type: 'enum',
    enum: ArtistStatus,
    default: ArtistStatus.PENDING,
  })
  status: ArtistStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'text', nullable: true })
  suspensionReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  suspensionNoticeDismissedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastReactivatedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  reactivationNoticeDismissedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  reviewedById: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
