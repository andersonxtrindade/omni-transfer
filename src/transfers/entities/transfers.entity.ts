import { Users } from 'src/users/entities/users.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
} from 'typeorm';

@Entity('transfer')
export class Transfer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Users, { eager: true })
    @JoinColumn({ name: 'senderId' })
    sender: Users;

    @ManyToOne(() => Users, { eager: true })
    @JoinColumn({ name: 'receiverId' })
    receiver: Users;

    @Column({ type: 'decimal' })
    amount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
