
from enum import Flag, IntFlag

print("Checking IntFlag behavior in Python 3.13")

class FastIntFlag(IntFlag):
    pass

class TestFlag(FastIntFlag):
    NO_CHANGE = 0
    CALLABLES_OK = 1
    SQL_OK = 2
    RELATED_OBJECT_OK = 4
    INIT_OK = 8
    NON_PERSISTENT_OK = 16
    LOAD_AGAINST_COMMITTED = 32
    NO_AUTOFLUSH = 64
    NO_RAISE = 128
    DEFERRED_HISTORY_LOAD = 256
    INCLUDE_PENDING_MUTATIONS = 512
    
    PASSIVE_OFF = RELATED_OBJECT_OK | NON_PERSISTENT_OK | INIT_OK | CALLABLES_OK | SQL_OK
    PASSIVE_RETURN_NO_VALUE = PASSIVE_OFF ^ INIT_OK
    PASSIVE_NO_INITIALIZE = PASSIVE_RETURN_NO_VALUE ^ CALLABLES_OK
    PASSIVE_NO_FETCH = PASSIVE_OFF ^ SQL_OK
    PASSIVE_NO_FETCH_RELATED = PASSIVE_OFF ^ RELATED_OBJECT_OK
    PASSIVE_ONLY_PERSISTENT = PASSIVE_OFF ^ NON_PERSISTENT_OK
    PASSIVE_MERGE = PASSIVE_OFF | NO_RAISE

print(f"TestFlag members count: {len(TestFlag.__members__.values())}")
print("TestFlag members:")
for i, member in enumerate(TestFlag.__members__.values()):
    print(f"{i+1}. {member.name}")

# 检查解包
try:
    (
        NO_CHANGE,
        CALLABLES_OK,
        SQL_OK,
        RELATED_OBJECT_OK,
        INIT_OK,
        NON_PERSISTENT_OK,
        LOAD_AGAINST_COMMITTED,
        NO_AUTOFLUSH,
        NO_RAISE,
        DEFERRED_HISTORY_LOAD,
        INCLUDE_PENDING_MUTATIONS,
        PASSIVE_OFF,
        PASSIVE_RETURN_NO_VALUE,
        PASSIVE_NO_INITIALIZE,
        PASSIVE_NO_FETCH,
        PASSIVE_NO_FETCH_RELATED,
        PASSIVE_ONLY_PERSISTENT,
        PASSIVE_MERGE,
    ) = TestFlag.__members__.values()
    
    print("\nUnpacking successful!")
except Exception as e:
    print(f"\nERROR unpacking: {e}")
    print(f"Expected 18 values, got {len(list(TestFlag.__members__.values()))}")
