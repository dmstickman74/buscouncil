import bcrypt
from sqlalchemy.orm import Session as DBSession
from api.models.auth import Role, RolePermission, User, UserRole
from api.models.councils import Council, CouncilMember


ROLES = {
    "admin": {
        "label": "Administrator",
        "permissions": [
            ("admin.full", "all"),
            ("thread.create", "all"),
            ("thread.reply", "all"),
            ("thread.pin", "all"),
            ("thread.lock", "all"),
            ("thread.delete", "all"),
            ("document.upload", "all"),
            ("meeting.manage", "all"),
            ("tag.manage", "all"),
            ("member.view_all", "all"),
            ("profile.edit", "all"),
            ("user.manage", "all"),
            ("council.manage", "all"),
        ],
    },
    "chair": {
        "label": "Council Chair",
        "permissions": [
            ("thread.create", "all"),
            ("thread.reply", "all"),
            ("thread.pin", "all"),
            ("thread.lock", "all"),
            ("thread.delete", "all"),
            ("document.upload", "all"),
            ("meeting.manage", "all"),
            ("tag.manage", "all"),
            ("member.view_all", "all"),
            ("profile.edit", "own"),
        ],
    },
    "vice_chair_membership": {
        "label": "Vice Chair, Membership",
        "permissions": [
            ("thread.create", "all"),
            ("thread.reply", "all"),
            ("thread.pin", "all"),
            ("thread.lock", "all"),
            ("document.upload", "all"),
            ("meeting.manage", "all"),
            ("tag.manage", "all"),
            ("member.view_all", "all"),
            ("profile.edit", "own"),
        ],
    },
    "vice_chair_programming": {
        "label": "Vice Chair, Programming",
        "permissions": [
            ("thread.create", "all"),
            ("thread.reply", "all"),
            ("thread.pin", "all"),
            ("thread.lock", "all"),
            ("document.upload", "all"),
            ("meeting.manage", "all"),
            ("tag.manage", "all"),
            ("member.view_all", "all"),
            ("profile.edit", "own"),
        ],
    },
    "firm_member": {
        "label": "Firm Member",
        "permissions": [
            ("thread.create", "all"),
            ("thread.reply", "all"),
            ("document.upload", "all"),
            ("profile.edit", "own"),
        ],
    },
    "industry_member": {
        "label": "Industry Member",
        "permissions": [
            ("thread.create", "all"),
            ("thread.reply", "all"),
            ("document.upload", "all"),
            ("profile.edit", "own"),
        ],
    },
}


def seed_roles(db: DBSession):
    for key, data in ROLES.items():
        role = db.query(Role).filter(Role.key == key).first()
        if not role:
            role = Role(key=key, label=data["label"])
            db.add(role)
            db.flush()

        for perm_key, scope in data["permissions"]:
            existing = db.query(RolePermission).filter(
                RolePermission.role_id == role.id,
                RolePermission.permission == perm_key,
            ).first()
            if not existing:
                db.add(RolePermission(role_id=role.id, permission=perm_key, scope=scope))

    db.commit()


def seed_dev_data(db: DBSession):
    seed_roles(db)

    admin_role = db.query(Role).filter(Role.key == "admin").first()
    firm_member_role = db.query(Role).filter(Role.key == "firm_member").first()
    chair_role = db.query(Role).filter(Role.key == "chair").first()
    vc_membership_role = db.query(Role).filter(Role.key == "vice_chair_membership").first()

    pw = bcrypt.hashpw("password".encode(), bcrypt.gensalt()).decode()

    if not db.query(User).filter(User.email == "admin@asla.org").first():
        admin = User(email="admin@asla.org", display_name="ASLA Admin", password_hash=pw)
        db.add(admin)
        db.flush()
        db.add(UserRole(user_id=admin.id, role_id=admin_role.id, granted_by="seed"))
        db.commit()

    if not db.query(Council).filter(Council.slug == "business-council-1").first():
        council = Council(name="Business Council", slug="business-council-1",
                          description="ASLA's first Business Council for landscape architecture firm leaders.")
        db.add(council)
        db.flush()

        users_data = [
            ("chair@example.com", "Jane Smith", "CEO", "Smith Landscape Architecture", chair_role, "chair"),
            ("member1@example.com", "Bob Johnson", "Principal", "Johnson Design Group", firm_member_role, "firm_member"),
            ("member2@example.com", "Alice Williams", "Managing Partner", "Williams & Associates", firm_member_role, "firm_member"),
        ]

        for email, name, title, company, sys_role, council_role in users_data:
            if not db.query(User).filter(User.email == email).first():
                user = User(email=email, display_name=name, password_hash=pw, title=title, company=company)
                db.add(user)
                db.flush()
                db.add(UserRole(user_id=user.id, role_id=sys_role.id, granted_by="seed"))
                db.add(CouncilMember(council_id=council.id, user_id=user.id, role=council_role))

        db.commit()
