
from sqlalchemy.orm.base import PassiveFlag

print("PassiveFlag members count:", len(PassiveFlag.__members__.values()))
print("PassiveFlag members:")
for i, member in enumerate(PassiveFlag.__members__.values()):
    print(f"{i+1}. {member.name}")

# 检查期望的成员数量
expected_count = 18
actual_count = len(PassiveFlag.__members__.values())

if actual_count != expected_count:
    print(f"\nERROR: Expected {expected_count} members, got {actual_count}")
