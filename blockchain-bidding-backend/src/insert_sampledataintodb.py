from datetime import datetime, timedelta
from main import app, db
from models.user import User, RFQ, Bid, Project, Milestone, ClarificationThread, ClarificationMessage

def seed_data():
    with app.app_context():
        db.drop_all()
        db.create_all()

        # -----------------------
        # Users
        # -----------------------
        admin = User(username="admin", role="admin")
        admin.set_password("admin123")

        owner = User(username="owner1", role="owner")
        owner.set_password("owner123")

        bidder1 = User(username="bidder1", role="bidder")
        bidder1.set_password("bidder123")

        bidder2 = User(username="bidder2", role="bidder")
        bidder2.set_password("bidder123")

        bidder3 = User(username="bidder3", role="bidder")
        bidder3.set_password("bidder123")

        db.session.add_all([admin, owner, bidder1, bidder2, bidder3])
        db.session.commit()

        # -----------------------
        # RFQs
        # -----------------------
        rfq1 = RFQ(
            owner_id=owner.id,
            title="Website Development RFQ",
            scope="Build a responsive company website with CMS",
            deadline=(datetime.utcnow() + timedelta(days=7)).isoformat(),
            evaluation_criteria="Experience, cost, and delivery timeline",
            category="IT Services",
            budget_min=5000,
            budget_max=15000,
            publish_date=datetime.utcnow().isoformat(),
            clarification_deadline=(datetime.utcnow() + timedelta(days=3)).isoformat(),
            start_date=(datetime.utcnow() + timedelta(days=8)).isoformat(),
            end_date=(datetime.utcnow() + timedelta(days=60)).isoformat(),
            eligibility_requirements="At least 3 years experience in web development",
            evaluation_weights='{"cost": 40, "experience": 30, "timeline": 30}',
            status="open"
        )

        rfq2 = RFQ(
            owner_id=owner.id,
            title="Mobile App Development RFQ",
            scope="Build iOS and Android mobile apps",
            deadline=(datetime.utcnow() + timedelta(days=10)).isoformat(),
            evaluation_criteria="Experience, cost, UI/UX quality",
            category="App Development",
            budget_min=10000,
            budget_max=50000,
            publish_date=datetime.utcnow().isoformat(),
            clarification_deadline=(datetime.utcnow() + timedelta(days=5)).isoformat(),
            start_date=(datetime.utcnow() + timedelta(days=11)).isoformat(),
            end_date=(datetime.utcnow() + timedelta(days=90)).isoformat(),
            eligibility_requirements="Experience with at least 3 mobile projects",
            evaluation_weights='{"cost": 35, "experience": 35, "UI/UX": 30}',
            status="open"
        )

        db.session.add_all([rfq1, rfq2])
        db.session.commit()

        # -----------------------
        # Bids
        # -----------------------
        bids = [
            Bid(
                rfq_id=rfq1.id,
                bidder_id=bidder1.id,
                price=10000,
                timeline="45 days",
                qualifications="5 years experience, 20+ projects",
                status="selected",
                phase1_status="pass",
                phase1_report={"documents": "all verified"},
                phase2_status="pass",
                phase2_score=92.5,
                phase2_breakdown={"cost": 35, "experience": 30, "timeline": 27.5},
                red_flags=[]
            ),
            Bid(
                rfq_id=rfq1.id,
                bidder_id=bidder2.id,
                price=15000,
                timeline="60 days",
                qualifications="2 years experience, 5 projects",
                status="rejected",
                phase1_status="fail",
                phase1_report={"missing_docs": "no financial statements"},
                phase2_status="not_applicable",
                red_flags=["Weak experience"]
            ),
            Bid(
                rfq_id=rfq1.id,
                bidder_id=bidder3.id,
                price=9000,
                timeline="40 days",
                qualifications="4 years experience, 10 projects",
                status="clarification_needed",
                phase1_status="pass",
                phase1_report={"documents": "valid"},
                phase2_status="pending",
                red_flags=["Unclear project timeline"]
            ),
            Bid(
                rfq_id=rfq1.id,
                bidder_id=bidder2.id,
                price=12000,
                timeline="50 days",
                qualifications="3 years experience, 8 projects",
                status="submitted",
                phase1_status="pending",
                phase2_status="pending"
            ),
            Bid(
                rfq_id=rfq2.id,
                bidder_id=bidder1.id,
                price=25000,
                timeline="70 days",
                qualifications="7 years mobile dev experience",
                status="submitted",
                phase1_status="pending",
                phase2_status="pending"
            ),
            Bid(
                rfq_id=rfq2.id,
                bidder_id=bidder3.id,
                price=28000,
                timeline="80 days",
                qualifications="5 years mobile dev, 15 apps",
                status="clarification_needed",
                phase1_status="clarification",
                red_flags=["UI/UX unclear"]
            )
        ]

        db.session.add_all(bids)
        db.session.commit()

        # -----------------------
        # Project & Milestones
        # -----------------------
        project1 = Project(rfq_id=rfq1.id, winner_bid_id=bids[0].id)
        project2 = Project(rfq_id=rfq2.id, winner_bid_id=bids[4].id)

        db.session.add_all([project1, project2])
        db.session.commit()

        milestones = [
            Milestone(project_id=project1.id, description="Deliver wireframes & mockups",
                      due_date=(datetime.utcnow() + timedelta(days=15)).isoformat(), status="pending"),
            Milestone(project_id=project1.id, description="Deploy beta version",
                      due_date=(datetime.utcnow() + timedelta(days=30)).isoformat(), status="pending"),
            Milestone(project_id=project2.id, description="App prototype delivery",
                      due_date=(datetime.utcnow() + timedelta(days=20)).isoformat(), status="pending"),
            Milestone(project_id=project2.id, description="Final app deployment",
                      due_date=(datetime.utcnow() + timedelta(days=60)).isoformat(), status="pending")
        ]

        db.session.add_all(milestones)
        db.session.commit()

        # -----------------------
        # Clarification Workflow
        # -----------------------
        clarification_threads = [
            ClarificationThread(bid_id=bids[2].id, owner_id=owner.id, status="open"),
            ClarificationThread(bid_id=bids[5].id, owner_id=owner.id, status="open")
        ]

        db.session.add_all(clarification_threads)
        db.session.commit()

        clarification_messages = [
            ClarificationMessage(thread_id=clarification_threads[0].id, sender_id=owner.id, role="owner",
                                 message="Please clarify how you plan to deliver within 40 days."),
            ClarificationMessage(thread_id=clarification_threads[0].id, sender_id=bidder3.id, role="bidder",
                                 message="We will assign additional resources to meet the timeline."),
            ClarificationMessage(thread_id=clarification_threads[1].id, sender_id=owner.id, role="owner",
                                 message="Please clarify your UI/UX approach."),
            ClarificationMessage(thread_id=clarification_threads[1].id, sender_id=bidder3.id, role="bidder",
                                 message="Will provide new UI/UX mockups within 3 days.")
        ]

        db.session.add_all(clarification_messages)
        db.session.commit()

        print("✅ Sample data seeded successfully!")

if __name__ == "__main__":
    seed_data()
