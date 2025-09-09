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
        db.session.add(rfq1)
        db.session.commit()

        # -----------------------
        # Bids
        # -----------------------
        bid1 = Bid(
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
        )

        bid2 = Bid(
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
        )

        bid3 = Bid(
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
        )

        bid4 = Bid(
            rfq_id=rfq1.id,
            bidder_id=bidder2.id,
            price=12000,
            timeline="50 days",
            qualifications="3 years experience, 8 projects",
            status="submitted",
            phase1_status="pending",
            phase2_status="pending"
        )

        db.session.add_all([bid1, bid2, bid3, bid4])
        db.session.commit()

        # -----------------------
        # Project & Milestones
        # -----------------------
        project1 = Project(rfq_id=rfq1.id, winner_bid_id=bid1.id)
        db.session.add(project1)
        db.session.commit()

        m1 = Milestone(
            project_id=project1.id,
            description="Deliver wireframes & mockups",
            due_date=(datetime.utcnow() + timedelta(days=15)).isoformat(),
            status="pending"
        )
        m2 = Milestone(
            project_id=project1.id,
            description="Deploy beta version",
            due_date=(datetime.utcnow() + timedelta(days=30)).isoformat(),
            status="pending"
        )
        db.session.add_all([m1, m2])
        db.session.commit()

        # -----------------------
        # Clarification Workflow
        # -----------------------
        clarification_thread = ClarificationThread(
            bid_id=bid3.id,
            owner_id=owner.id,
            status="open"
        )
        db.session.add(clarification_thread)
        db.session.commit()

        msg1 = ClarificationMessage(
            thread_id=clarification_thread.id,
            sender_id=owner.id,
            role="owner",
            message="Please clarify how you plan to deliver within 40 days."
        )
        msg2 = ClarificationMessage(
            thread_id=clarification_thread.id,
            sender_id=bidder3.id,
            role="bidder",
            message="We will assign additional resources to meet the timeline."
        )
        db.session.add_all([msg1, msg2])
        db.session.commit()

        print("✅ Sample data seeded successfully!")

if __name__ == "__main__":
    seed_data()
